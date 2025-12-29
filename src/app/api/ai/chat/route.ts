import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { callAI } from '@/lib/ai'

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
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
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

    // Return format iOS app expects
    return NextResponse.json({
      success: true,
      message: response
    })
  } catch (error) {
    console.error('AI Chat error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}
