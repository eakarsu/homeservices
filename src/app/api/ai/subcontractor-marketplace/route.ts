// Sub-contractor marketplace with vetting and ratings.
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type Sub = { id: string; name: string; trades: string[]; rating: number; reviewCount: number; verified: boolean; lat?: number; lng?: number }
type Bid = { id: string; jobId: string; subId: string; amountUSD: number; eta: string; at: Date }

const subs = new Map<string, Sub>()
const bids: Bid[] = []

function dist(a?: number, b?: number, c?: number, d?: number) {
  if ([a, b, c, d].some(x => x == null)) return null
  return Math.sqrt((a! - c!) ** 2 + (b! - d!) ** 2) * 111
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { action } = body

  if (action === 'register') {
    const { id, name, trades, lat, lng } = body
    if (!id || !name) return NextResponse.json({ error: 'id and name required' }, { status: 400 })
    subs.set(id, { id, name, trades: trades || [], rating: 0, reviewCount: 0, verified: false, lat, lng })
    return NextResponse.json(subs.get(id))
  }

  if (action === 'verify') {
    const s = subs.get(body.id)
    if (!s) return NextResponse.json({ error: 'sub not found' }, { status: 404 })
    s.verified = true
    return NextResponse.json(s)
  }

  if (action === 'rate') {
    const s = subs.get(body.id)
    if (!s) return NextResponse.json({ error: 'sub not found' }, { status: 404 })
    s.rating = ((s.rating * s.reviewCount) + Number(body.stars || 0)) / (s.reviewCount + 1)
    s.reviewCount++
    return NextResponse.json(s)
  }

  if (action === 'find-bids') {
    const { trade, jobLat, jobLng, maxKm = 50 } = body
    const candidates = [...subs.values()].filter(s => (!trade || s.trades.includes(trade)) && s.verified)
    const ranked = candidates.map(s => ({
      ...s,
      distanceKm: dist(s.lat, s.lng, jobLat, jobLng)
    })).filter(s => !s.distanceKm || s.distanceKm <= maxKm).sort((a, b) => b.rating - a.rating)
    return NextResponse.json({ candidates: ranked.slice(0, 20) })
  }

  if (action === 'bid') {
    const { jobId, subId, amountUSD, eta } = body
    if (!jobId || !subId || amountUSD == null) return NextResponse.json({ error: 'jobId, subId, amountUSD required' }, { status: 400 })
    const bid: Bid = { id: `b_${Date.now()}`, jobId, subId, amountUSD, eta: eta || 'TBD', at: new Date() }
    bids.push(bid)
    return NextResponse.json(bid)
  }

  if (action === 'list-bids') {
    return NextResponse.json({ bids: bids.filter(b => !body.jobId || b.jobId === body.jobId) })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
