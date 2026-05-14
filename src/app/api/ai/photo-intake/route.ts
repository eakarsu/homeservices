/**
 * AI Photo Intake — Equipment Identification
 *
 * Tech sends a photo (data URL or HTTP URL); a vision-capable Claude model
 * extracts make/model/serial. Optionally creates an Equipment record on the
 * given property.
 *
 * Body: {
 *   imageUrl: string             // https:// or data: URL
 *   propertyId?: string          // when present, an Equipment record is created
 *   tradeType?: string           // hint for the model
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { aiRateLimiter, parseAIJson, logAIResult, AI_MODEL } from '@/lib/ai-utils'

interface VisionResult {
  type: string
  make: string | null
  model: string | null
  serial: string | null
  capacity: string | null
  yearOfManufacture: number | null
  notes: string
  confidence: number
}

type EquipmentTypeEnum =
  | 'AC_UNIT'
  | 'FURNACE'
  | 'HEAT_PUMP'
  | 'AIR_HANDLER'
  | 'WATER_HEATER'
  | 'TANKLESS_WATER_HEATER'
  | 'BOILER'
  | 'MINI_SPLIT'
  | 'THERMOSTAT'
  | 'ELECTRICAL_PANEL'
  | 'GARBAGE_DISPOSAL'
  | 'SUMP_PUMP'
  | 'HVAC_PACKAGE'
  | 'OTHER'

function mapEquipmentType(s: string): EquipmentTypeEnum {
  const k = s.toLowerCase()
  if (k.includes('mini split') || k.includes('mini-split')) return 'MINI_SPLIT'
  if (k.includes('tankless')) return 'TANKLESS_WATER_HEATER'
  if (k.includes('water heater')) return 'WATER_HEATER'
  if (k.includes('heat pump')) return 'HEAT_PUMP'
  if (k.includes('furnace')) return 'FURNACE'
  if (k.includes('boiler')) return 'BOILER'
  if (k.includes('thermostat')) return 'THERMOSTAT'
  if (k.includes('panel')) return 'ELECTRICAL_PANEL'
  if (k.includes('disposal')) return 'GARBAGE_DISPOSAL'
  if (k.includes('sump')) return 'SUMP_PUMP'
  if (k.includes('air handler')) return 'AIR_HANDLER'
  if (k.includes('package')) return 'HVAC_PACKAGE'
  if (k.includes('ac') || k.includes('air conditioner')) return 'AC_UNIT'
  return 'OTHER'
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const rl = aiRateLimiter(user.id)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'AI rate limit exceeded', retryAfter: Math.ceil(rl.resetIn / 1000) },
        { status: 429 }
      )
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { imageUrl, propertyId, tradeType } = body
    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }

    // Verify property ownership if propertyId supplied
    if (propertyId) {
      const property = await prisma.property.findFirst({
        where: { id: propertyId, customer: { companyId: user.companyId } },
      })
      if (!property) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 })
      }
    }

    const isOpenRouter = !!process.env.OPENROUTER_API_KEY
    const baseUrl = isOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1'

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
    if (isOpenRouter) {
      headers['HTTP-Referer'] = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      headers['X-Title'] = 'Home Services AI - Photo Intake'
    }

    const systemPrompt = `You are an expert home services equipment identifier. Given a photograph of an HVAC, plumbing, or electrical unit, identify:
- equipment type (e.g. "split AC", "tankless water heater")
- manufacturer (make)
- model number
- serial number (if visible on a nameplate)
- nominal capacity (BTU, gallons, amps, etc.)
- year of manufacture (estimate from serial format if possible)

Return ONLY JSON: {"type":"string","make":"string|null","model":"string|null","serial":"string|null","capacity":"string|null","yearOfManufacture":number|null,"notes":"string","confidence":0-1}`

    const userPrompt = tradeType
      ? `Trade hint: ${tradeType}. Identify the equipment shown in the image.`
      : 'Identify the equipment shown in the image.'

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: isOpenRouter ? AI_MODEL : 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 700,
      }),
    })

    if (!resp.ok) {
      const txt = await resp.text()
      throw new Error(`Vision model error: ${resp.status} ${txt.slice(0, 200)}`)
    }

    const data = await resp.json()
    const text = data.choices?.[0]?.message?.content || ''
    const parsed = parseAIJson<VisionResult>(text)
    if (!parsed) throw new Error('Vision response could not be parsed')

    let equipmentId: string | null = null
    if (propertyId && parsed.make && parsed.model) {
      try {
        const eq = await prisma.equipment.create({
          data: {
            propertyId,
            type: mapEquipmentType(parsed.type || ''),
            brand: parsed.make,
            model: parsed.model,
            serialNumber: parsed.serial || undefined,
            installDate: parsed.yearOfManufacture
              ? new Date(parsed.yearOfManufacture, 0, 1)
              : undefined,
            notes: parsed.notes,
          },
        })
        equipmentId = eq.id
      } catch (e) {
        console.error('Failed to auto-create equipment:', e)
      }
    }

    await logAIResult({
      feature: 'photo-intake',
      userId: user.id,
      companyId: user.companyId,
      input: { propertyId: propertyId || null, tradeType: tradeType || null, hasImage: true },
      output: { ...parsed, equipmentId },
      durationMs: Date.now() - startedAt,
      success: true,
    })

    return NextResponse.json({
      ...parsed,
      equipmentId,
      _meta: { model: AI_MODEL, rateLimit: { remaining: rl.remaining } },
    })
  } catch (error) {
    console.error('Photo intake error:', error)
    await logAIResult({
      feature: 'photo-intake',
      input: {},
      output: {},
      durationMs: Date.now() - startedAt,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json(
      { error: 'Photo intake failed', message: error instanceof Error ? error.message : 'unknown' },
      { status: 500 }
    )
  }
}
