// Fleet GPS + fuel-card integration with cost-per-mile reporting.
// TODO: configure credentials — SAMSARA_API_TOKEN or VERIZON_REVEAL_API_KEY, WEX_API_KEY.
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type Position = { truckId: string; lat: number; lng: number; speed: number; odometerMi: number; at: number }
type Fuel = { truckId: string; gallons: number; costUSD: number; date: string }

const positions = new Map<string, Position>()
const fuel: Fuel[] = []

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { action } = body

  if (action === 'ingest-position') {
    const { truckId, lat, lng, speed = 0, odometerMi = 0 } = body
    if (!truckId || lat == null || lng == null) return NextResponse.json({ error: 'truckId, lat, lng required' }, { status: 400 })
    positions.set(truckId, { truckId, lat, lng, speed, odometerMi, at: Date.now() })
    return NextResponse.json({ ok: true })
  }

  if (action === 'ingest-fuel') {
    const { truckId, gallons, costUSD, date } = body
    if (!truckId || gallons == null) return NextResponse.json({ error: 'truckId and gallons required' }, { status: 400 })
    fuel.push({ truckId, gallons: Number(gallons), costUSD: Number(costUSD || 0), date: date || new Date().toISOString().slice(0, 10) })
    return NextResponse.json({ ok: true, total: fuel.length })
  }

  if (action === 'report') {
    const { truckId, startDate, endDate } = body
    const fuelRows = fuel.filter(f =>
      (!truckId || f.truckId === truckId) &&
      (!startDate || f.date >= startDate) &&
      (!endDate || f.date <= endDate)
    )
    const totalGallons = fuelRows.reduce((s, f) => s + f.gallons, 0)
    const totalUSD = fuelRows.reduce((s, f) => s + f.costUSD, 0)
    const pos = truckId ? positions.get(truckId) : null
    const miles = pos?.odometerMi || 0
    return NextResponse.json({
      truckId: truckId || 'fleet',
      totalGallons,
      totalUSD: Math.round(totalUSD * 100) / 100,
      milesDriven: miles,
      mpg: miles && totalGallons ? Math.round((miles / totalGallons) * 10) / 10 : null,
      costPerMile: miles ? Math.round((totalUSD / miles) * 100) / 100 : null
    })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ trucks: [...positions.values()], fuelEvents: fuel.length })
}
