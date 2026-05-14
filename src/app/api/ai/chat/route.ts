import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { callAI } from '@/lib/ai'
import { aiRateLimiter, logAIResult, AI_MODEL } from '@/lib/ai-utils'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  context?: string
}

const SYSTEM_PROMPT = `You are an AI assistant for a home services business management platform called ServiceCrew AI.
You help with:
- HVAC, plumbing, and electrical service questions
- Job scheduling and dispatch optimization
- Customer relationship management
- Inventory and parts management
- Technician assignments and routing
- Generating quotes and estimates
- Business insights and analytics

Be helpful, professional, and concise. If asked about something outside home services business management, politely redirect the conversation.
When providing technical advice, always recommend consulting a licensed professional for safety-critical work.`

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const rl = aiRateLimiter(user.id)
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'AI rate limit exceeded', retryAfter: Math.ceil(rl.resetIn / 1000) },
        { status: 429 }
      )
    }

    const body: ChatRequest = await request.json()
    const { messages, context } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Messages are required' },
        { status: 400 }
      )
    }

    // Build the messages array with system prompt
    const aiMessages: ChatMessage[] = [
      {
        role: 'system',
        content: context
          ? `${SYSTEM_PROMPT}\n\nAdditional context: ${context}`
          : SYSTEM_PROMPT
      },
      ...messages
    ]

    const response = await callAI(aiMessages, {
      temperature: 0.7,
      maxTokens: 2000,
    })

    await logAIResult({
      feature: 'chat',
      userId: user.id,
      companyId: user.companyId,
      input: { turnCount: messages.length, contextLength: (context || '').length },
      output: { responseLength: response.length },
      durationMs: Date.now() - startedAt,
      success: true,
    })

    // Return format iOS app expects
    return NextResponse.json({
      success: true,
      message: response,
      _meta: { model: AI_MODEL, rateLimit: { remaining: rl.remaining } },
    })
  } catch (error) {
    console.error('AI Chat error:', error)
    await logAIResult({
      feature: 'chat',
      input: {},
      output: {},
      durationMs: Date.now() - startedAt,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json(
      { success: false, error: 'Failed to get AI response', message: error instanceof Error ? error.message : 'unknown' },
      { status: 500 }
    )
  }
}
