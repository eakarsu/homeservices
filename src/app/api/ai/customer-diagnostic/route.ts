/**
 * Public Customer Self-Diagnostic
 *
 * Customer describes the problem. AI runs diagnostics (and a rough quote)
 * and offers to book an appointment. NO auth required, but rate-limited
 * by IP+companyId.
 *
 * Body: { companyId: string; tradeType: string; symptoms: string[]; equipmentType?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { generateDiagnostics, generateEstimate } from '@/lib/ai'
import { aiRateLimiter, logAIResult, AI_MODEL } from '@/lib/ai-utils'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  try {
    const body = await request.json().catch(() => ({}))
    const { companyId, tradeType, symptoms, equipmentType } = body
    if (!companyId || !tradeType || !Array.isArray(symptoms) || symptoms.length === 0) {
      return NextResponse.json(
        { error: 'companyId, tradeType, and symptoms are required' },
        { status: 400 }
      )
    }

    // Confirm company exists & is accepting public diagnostics
    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) {
      return NextResponse.json({ error: 'Unknown company' }, { status: 404 })
    }

    // IP-bucketed rate limit (public endpoint)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const rl = aiRateLimiter(`public:${ip}:${companyId}`)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many diagnostic attempts — please wait or call us', retryAfter: Math.ceil(rl.resetIn / 1000) },
        { status: 429 }
      )
    }

    const diagnostics = await generateDiagnostics(
      equipmentType || tradeType,
      symptoms.join(', ')
    )

    let estimate: unknown = null
    try {
      estimate = await generateEstimate(
        tradeType,
        equipmentType || 'unknown',
        'residential',
        symptoms.join('; ')
      )
    } catch (e) {
      console.warn('Estimate generation failed in customer-diagnostic:', e)
    }

    await logAIResult({
      feature: 'customer-diagnostic',
      companyId,
      input: { tradeType, symptoms, equipmentType, ip },
      output: { diagnostics, estimateOk: !!estimate },
      durationMs: Date.now() - startedAt,
      success: true,
    })

    return NextResponse.json({
      diagnostics,
      estimate,
      bookingHint: 'To book this work, please use the contact form or call our office.',
      _meta: { model: AI_MODEL, rateLimit: { remaining: rl.remaining } },
    })
  } catch (error) {
    console.error('Customer diagnostic error:', error)
    return NextResponse.json(
      { error: 'Diagnostic failed', message: error instanceof Error ? error.message : 'unknown' },
      { status: 500 }
    )
  }
}
