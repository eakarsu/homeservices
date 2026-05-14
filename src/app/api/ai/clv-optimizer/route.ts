// CLV optimizer (upsell / cross-sell per customer based on service history).
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
  const { customerId } = await req.json()
  if (!customerId) return NextResponse.json({ error: 'customerId required' }, { status: 400 })

  let customer: any = null
  let jobs: any[] = []
  try {
    customer = await (prisma as any).customer.findUnique({ where: { id: customerId } })
    jobs = await (prisma as any).job.findMany({ where: { customerId }, take: 30, orderBy: { createdAt: 'desc' } })
  } catch {}

  const totalRevenue = jobs.reduce((s, j) => s + (j.finalAmount || j.estimatedPrice || 0), 0)
  const intervals = jobs.length > 1
    ? jobs.slice(1).map((j, i) => (+new Date(jobs[i].createdAt) - +new Date(j.createdAt)) / 86400000)
    : []
  const avgIntervalDays = intervals.length ? intervals.reduce((s, x) => s + x, 0) / intervals.length : null

  let suggestions: any = null
  if (openai && jobs.length) {
    const r = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'Suggest upsell/cross-sell. Return JSON {"suggestions":[{"service":string,"reason":string,"priority":1-3}]}.' },
        { role: 'user', content: `Customer: ${JSON.stringify(customer || {}).slice(0, 1000)}\nLast jobs: ${JSON.stringify(jobs.slice(0, 5)).slice(0, 1500)}` }
      ],
      max_tokens: 500
    })
    try { suggestions = JSON.parse(r.choices[0].message.content!.match(/\{[\s\S]*\}/)![0]) }
    catch { suggestions = { raw: r.choices[0].message.content } }
  }

  return NextResponse.json({
    customerId,
    historicalRevenueUSD: totalRevenue,
    jobCount: jobs.length,
    avgIntervalDays: avgIntervalDays ? Math.round(avgIntervalDays) : null,
    projectedAnnualCLV: avgIntervalDays && totalRevenue ? Math.round((totalRevenue / Math.max(1, jobs.length)) * (365 / Math.max(30, avgIntervalDays))) : null,
    suggestions
  })
}
