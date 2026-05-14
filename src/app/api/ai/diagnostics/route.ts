import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { callAI } from '@/lib/ai'
import { aiRateLimiter, parseAIJson, logAIResult, AI_MODEL } from '@/lib/ai-utils'

interface DiagnosticRequest {
  tradeType: string
  symptoms: string[]
  additionalInfo?: string
  equipmentType?: string
  equipmentAge?: number
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

    const body: DiagnosticRequest = await request.json()
    const { tradeType, symptoms, additionalInfo, equipmentType, equipmentAge } = body

    if (!tradeType || !symptoms || symptoms.length === 0) {
      return NextResponse.json(
        { error: 'tradeType and symptoms are required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert ${tradeType} diagnostic assistant for a home services company.
Analyze the symptoms and provide detailed diagnostic information.
Be thorough but practical. Focus on common issues first before rare ones.
Always respond with valid JSON in the exact format requested.`

    const userPrompt = `Trade Type: ${tradeType}
Equipment Type: ${equipmentType || 'Not specified'}
Equipment Age: ${equipmentAge ? `${equipmentAge} years` : 'Unknown'}
Symptoms: ${symptoms.join(', ')}
Additional Info: ${additionalInfo || 'None provided'}

Analyze this and provide a diagnostic report in this exact JSON format:
{
  "possibleCauses": [
    {
      "cause": "string - name of the issue",
      "probability": number (0-100),
      "explanation": "string - why this might be the cause"
    }
  ],
  "recommendedActions": [
    {
      "action": "string - what to do",
      "priority": "high" | "medium" | "low",
      "estimatedTime": number (minutes),
      "partsNeeded": ["string array of parts"]
    }
  ],
  "additionalQuestions": ["string array of questions to ask customer"],
  "safetyWarnings": ["string array of safety concerns"],
  "estimatedRepairCost": {
    "low": number (dollars),
    "high": number (dollars)
  }
}

Provide 2-4 possible causes ranked by probability, 2-4 recommended actions, and relevant safety warnings.`

    const response = await callAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      { temperature: 0.3, maxTokens: 2000 }
    )

    const result = parseAIJson<unknown>(response)
    if (!result) {
      throw new Error('AI returned an unparseable response')
    }

    await logAIResult({
      feature: 'diagnostics',
      userId: user.id,
      companyId: user.companyId,
      input: { tradeType, symptoms, equipmentType, equipmentAge },
      output: result,
      durationMs: Date.now() - startedAt,
      success: true,
    })

    return NextResponse.json({
      ...(result as Record<string, unknown>),
      _meta: { model: AI_MODEL, rateLimit: { remaining: rl.remaining } },
    })
  } catch (error) {
    console.error('Diagnostics error:', error)
    await logAIResult({
      feature: 'diagnostics',
      input: {},
      output: {},
      durationMs: Date.now() - startedAt,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json(
      { error: 'Diagnostics failed', message: error instanceof Error ? error.message : 'unknown' },
      { status: 500 }
    )
  }
}
