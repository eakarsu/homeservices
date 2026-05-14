// Technician quality/safety advisor (flag risky jobs, real-time guidance).
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

const hasKey = !!process.env.OPENROUTER_API_KEY
const openai = hasKey ? new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
}) : null
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!openai) return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  const { job, technicianContext } = await req.json()
  if (!job) return NextResponse.json({ error: 'job required' }, { status: 400 })

  const r = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: 'You are a trades safety supervisor. Return JSON {"risk_level":"low|medium|high","hazards":[string],"required_ppe":[string],"steps":[string],"escalate_to_lead":bool}.' },
      { role: 'user', content: `Job: ${JSON.stringify(job).slice(0, 4000)}\nTech: ${JSON.stringify(technicianContext || {})}` }
    ],
    max_tokens: 600,
    temperature: 0.2
  })
  let parsed: any
  try { parsed = JSON.parse(r.choices[0].message.content!.match(/\{[\s\S]*\}/)![0]) }
  catch { parsed = { raw: r.choices[0].message.content } }
  return NextResponse.json(parsed)
}
