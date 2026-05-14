// Voice-first job intake (customer calls → AI books + sends quote).
// TODO: configure credentials — TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER.
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Session = { id: string; transcript: { role: 'user' | 'assistant'; text: string }[]; intake: any }
const sessions = new Map<string, Session>()

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022'

async function ai(messages: any[], max = 600) {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages, max_tokens: max, temperature: 0.4 })
  })
  const d = await r.json()
  if (d.error) throw new Error(d.error.message)
  return d.choices[0].message.content
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { action } = body

  if (action === 'start') {
    const id = `vi_${Date.now()}`
    sessions.set(id, { id, transcript: [], intake: {} })
    return NextResponse.json({ sessionId: id })
  }

  if (action === 'utterance') {
    if (!OPENROUTER_API_KEY) return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 503 })
    const s = sessions.get(body.sessionId)
    if (!s) return NextResponse.json({ error: 'session not found' }, { status: 404 })
    s.transcript.push({ role: 'user', text: body.text })
    const reply = await ai([
      { role: 'system', content: 'You are a home services dispatcher. Capture service type, address, urgency, timing. Reply briefly and return ONLY plain text.' },
      ...s.transcript.slice(-8).map(t => ({ role: t.role, content: t.text }))
    ])
    s.transcript.push({ role: 'assistant', text: reply })
    return NextResponse.json({ reply })
  }

  if (action === 'finalize') {
    const s = sessions.get(body.sessionId)
    if (!s) return NextResponse.json({ error: 'session not found' }, { status: 404 })
    if (!OPENROUTER_API_KEY) return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 503 })
    const transcript = s.transcript.map(t => `${t.role}: ${t.text}`).join('\n')
    const structured = await ai([
      { role: 'system', content: 'Return JSON {"serviceType":string,"address":string,"customerName":string,"urgency":"now|today|this_week|flexible","quoteUSD":number,"notes":string}.' },
      { role: 'user', content: transcript }
    ])
    let parsed: any
    try { parsed = JSON.parse(structured.match(/\{[\s\S]*\}/)![0]) } catch { parsed = { raw: structured } }
    s.intake = parsed
    let jobId: string | null = null
    try {
      const j: any = await (prisma as any).job.create({ data: { type: parsed.serviceType || 'unknown', address: parsed.address || '', estimatedPrice: parsed.quoteUSD || 0, source: 'voice', notes: parsed.notes || '' } })
      jobId = j.id
    } catch {}
    return NextResponse.json({ intake: parsed, jobId })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
