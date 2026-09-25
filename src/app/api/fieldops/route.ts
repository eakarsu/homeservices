/**
 * Field-operations API.
 *
 * One endpoint per action, backed by `src/lib/workflows/fieldops.ts`. These
 * replace five `gap-no-*` stubs that logged "this is missing" while the data
 * needed to answer each question was already in the schema.
 *
 *   GET  /api/fieldops?action=payroll-export&from=…&to=…   timesheet → payroll rows (CSV or JSON)
 *   GET  /api/fieldops?action=reorder                      parts replenishment suggestions
 *   GET  /api/fieldops?action=nps&from=…&to=…              post-job NPS summary
 *   GET  /api/fieldops?action=safety                       technician safety/quality signals
 *   POST /api/fieldops?action=gp-ping                      record a fleet GPS position
 *   POST /api/fieldops?action=fuel-card                    ingest one fuel-card transaction
 *   POST /api/fieldops?action=warranty                     classify a warranty claim
 *
 * Every response carries the `assumptions` the computation relied on, or an
 * explicit `confidence: "insufficient-history"` instead of a fabricated number.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import {
  classifyWarranty,
  ingestFuelCard,
  payrollExport,
  recordFleetPing,
  reorderSuggestions,
  safetyQualitySignals,
  summariseNps,
  toCsv,
  type FuelCardEntry,
  type FleetPing,
} from '@/lib/workflows/fieldops'

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function parseDate(value: string | null, fallback: Date): Date {
  if (!value) return fallback
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? fallback : d
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return bad('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'payroll-export': {
        const to = parseDate(searchParams.get('to'), new Date())
        const from = parseDate(searchParams.get('from'), new Date(to.getTime() - 28 * 86_400_000))
        const result = await payrollExport({ companyId: user.companyId, from, to })
        if (searchParams.get('format') === 'csv') {
          return new NextResponse(toCsv(result.rows, result.totals), {
            status: 200,
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="payroll-${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.csv"`,
            },
          })
        }
        return NextResponse.json({ ...result, from, to })
      }

      case 'reorder': {
        const result = await reorderSuggestions({
          companyId: user.companyId,
          lookbackDays: Number(searchParams.get('lookbackDays')) || undefined,
          targetWeeksCover: Number(searchParams.get('targetWeeksCover')) || undefined,
        })
        return NextResponse.json(result)
      }

      case 'nps': {
        const result = await summariseNps({
          companyId: user.companyId,
          from: searchParams.get('from') ? parseDate(searchParams.get('from'), new Date()) : undefined,
          to: searchParams.get('to') ? parseDate(searchParams.get('to'), new Date()) : undefined,
        })
        return NextResponse.json({
          ...result,
          assumptions: [
            'NPS = %promoters (9-10) minus %detractors (0-6) over the selected window.',
            'Scores of 7-8 are passives and do not move the score.',
            'Trend is reported only once at least 8 scored responses exist.',
          ],
        })
      }

      case 'safety': {
        const result = await safetyQualitySignals({
          companyId: user.companyId,
          windowDays: Number(searchParams.get('windowDays')) || undefined,
        })
        return NextResponse.json(result)
      }

      default:
        return bad(
          `action must be one of: payroll-export, reorder, nps, safety`,
        )
    }
  } catch (error) {
    console.error('fieldops GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Field-ops query failed' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return bad('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body = await request.json().catch(() => ({}))

    switch (action) {
      case 'gp-ping': {
        const ping: FleetPing = {
          truckId: body.truckId,
          latitude: Number(body.latitude),
          longitude: Number(body.longitude),
          recordedAt: body.recordedAt ?? new Date().toISOString(),
          speedMph: body.speedMph != null ? Number(body.speedMph) : undefined,
          headingDeg: body.headingDeg != null ? Number(body.headingDeg) : undefined,
          source: body.source,
        }
        const result = await recordFleetPing(user.companyId, ping)
        return NextResponse.json(result, { status: result.accepted ? 201 : 422 })
      }

      case 'fuel-card': {
        const entry: FuelCardEntry = {
          truckId: body.truckId,
          cardLast4: String(body.cardLast4 ?? ''),
          vendor: body.vendor ?? '',
          fuelType: body.fuelType ?? 'diesel',
          gallons: Number(body.gallons),
          amount: Number(body.amount),
          odometer: body.odometer != null ? Number(body.odometer) : undefined,
          purchasedAt: body.purchasedAt ?? new Date().toISOString(),
          externalRef: String(body.externalRef ?? ''),
        }
        if (!entry.externalRef) return bad('externalRef is required for idempotent ingestion')
        const result = await ingestFuelCard(user.companyId, entry)
        return NextResponse.json(result, { status: result.status === 'created' ? 201 : 200 })
      }

      case 'warranty': {
        if (!body.equipmentId) return bad('equipmentId is required')
        if (!body.failureDate) return bad('failureDate is required')
        const result = await classifyWarranty({
          companyId: user.companyId,
          equipmentId: body.equipmentId,
          failureDate: new Date(body.failureDate),
          warrantyMonths: body.warrantyMonths != null ? Number(body.warrantyMonths) : undefined,
        })
        return NextResponse.json(result)
      }

      default:
        return bad('action must be one of: gp-ping, fuel-card, warranty')
    }
  } catch (error) {
    console.error('fieldops POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Field-ops action failed' },
      { status: 500 },
    )
  }
}