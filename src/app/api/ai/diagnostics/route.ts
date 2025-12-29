import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'

import { callAI } from '@/lib/ai'

interface DiagnosticRequest {
  tradeType: string
  symptoms: string[]
  additionalInfo?: string
  equipmentType?: string
  equipmentAge?: number
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    try {
      const result = JSON.parse(response)
      return NextResponse.json(result)
    } catch {
      // Fallback response if AI doesn't return valid JSON
      return NextResponse.json({
        possibleCauses: [
          {
            cause: 'Unable to determine specific cause',
            probability: 50,
            explanation: 'Based on the symptoms provided, an on-site inspection is recommended to accurately diagnose the issue.'
          }
        ],
        recommendedActions: [
          {
            action: 'Schedule on-site diagnostic visit',
            priority: 'high',
            estimatedTime: 60,
            partsNeeded: []
          },
          {
            action: 'Gather more information from customer',
            priority: 'medium',
            estimatedTime: 15,
            partsNeeded: []
          }
        ],
        additionalQuestions: [
          'When did you first notice this issue?',
          'Has the equipment been serviced recently?',
          'Are there any unusual sounds or smells?'
        ],
        safetyWarnings: tradeType === 'ELECTRICAL'
          ? ['Do not attempt electrical repairs without proper training', 'Turn off power at breaker before inspection']
          : tradeType === 'PLUMBING' && symptoms.some(s => s.toLowerCase().includes('gas'))
          ? ['If you smell gas, evacuate immediately and call gas company']
          : [],
        estimatedRepairCost: {
          low: 150,
          high: 500
        }
      })
    }
  } catch (error) {
    console.error('Diagnostics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
