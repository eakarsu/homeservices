/**
 * AI Subscription Health Monitor
 *
 * For active service-agreement plans, scans equipment age + service history
 * and proposes preventive visit dates with priority + reasoning.
 *
 * Body: { agreementPlanId?: string; limit?: number }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import {
  AI_MODEL,
  aiRateLimiter,
  parseAIJson,
  logAIResult,
} from '@/lib/ai-utils'
import { callAI } from '@/lib/ai'

interface PlanRecommendation {
  agreementId: string
  customerName: string
  recommendedDate: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  reasoning: string
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

    const body = await request.json().catch(() => ({}))
    const limit = Math.min(50, Math.max(1, body.limit ?? 25))

    // Fetch active service agreements scoped to this company
    const agreements = await prisma.serviceAgreement.findMany({
      where: {
        status: 'ACTIVE',
        customer: { companyId: user.companyId },
        ...(body.agreementPlanId ? { planId: body.agreementPlanId } : {}),
      },
      take: limit,
      include: {
        customer: { include: { properties: { include: { equipment: true } } } },
        plan: true,
      },
    })

    if (agreements.length === 0) {
      return NextResponse.json({ recommendations: [], message: 'No active agreements found' })
    }

    const summary = agreements
      .map((a) => {
        const allEquipment = a.customer.properties.flatMap((p) => p.equipment)
        const equipDescs = allEquipment
          .map((e) => {
            const ageYears = e.installDate
              ? new Date().getFullYear() - new Date(e.installDate).getFullYear()
              : 'unknown'
            const lastSvc = e.lastServiceDate
              ? new Date(e.lastServiceDate).toISOString().slice(0, 10)
              : 'never'
            return `${e.type} ${e.brand || ''} ${e.model || ''} (age ${ageYears}y, last service ${lastSvc})`
          })
          .join('; ')
        const customerName =
          [a.customer.firstName, a.customer.lastName].filter(Boolean).join(' ') ||
          a.customer.companyName ||
          'Unknown'
        return `${a.id}: ${customerName} | plan: ${a.plan?.name || 'unknown'} | equipment: ${equipDescs || 'none'}`
      })
      .join('\n')

    const systemPrompt = `You are a service-plan health monitor. Recommend preventive maintenance visits.
Prioritise old (10+ year) equipment, equipment with no service in >12 months, and seasonal needs (HVAC tune-ups in Spring/Fall).
Return JSON ONLY: {"recommendations": [{"agreementId": "string", "customerName": "string", "recommendedDate": "YYYY-MM-DD", "priority": "HIGH|MEDIUM|LOW", "reasoning": "string"}]}`
    const userPrompt = `Today is ${new Date().toISOString().slice(0, 10)}.\n\nActive service agreements:\n${summary}`

    const aiText = await callAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 1500 }
    )

    const parsed = parseAIJson<{ recommendations: PlanRecommendation[] }>(aiText)
    if (!parsed) throw new Error('Could not parse AI recommendations')

    await logAIResult({
      feature: 'subscription-health',
      userId: user.id,
      companyId: user.companyId,
      input: { agreementCount: agreements.length },
      output: { recommendationCount: parsed.recommendations?.length || 0 },
      durationMs: Date.now() - startedAt,
      success: true,
    })

    return NextResponse.json({
      recommendations: parsed.recommendations || [],
      _meta: { model: AI_MODEL, scanned: agreements.length, rateLimit: { remaining: rl.remaining } },
    })
  } catch (error) {
    console.error('Subscription health error:', error)
    return NextResponse.json(
      { error: 'Subscription health failed', message: error instanceof Error ? error.message : 'unknown' },
      { status: 500 }
    )
  }
}
