/**
 * Reconciliation + presence API.
 *
 * Replaces three `gap-no-*` stubs:
 *   GET /api/reconcile?action=quickbooks-sync   QuickBooks push/pull envelope
 *   GET /api/reconcile?action=presence           who is where, from assignments
 *   GET /api/reconcile?action=price-position     price book vs maintained benchmarks
 *
 * Each response carries the `assumptions` behind the numbers. Where a vendor
 * connection or a benchmark is absent the response says so explicitly instead
 * of inventing one.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import {
  presenceSnapshot,
  pricePosition,
  syncQuickBooks,
} from '@/lib/workflows/reconcile'

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return bad('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'quickbooks-sync': {
        const since = searchParams.get('since')
        const result = await syncQuickBooks({
          companyId: user.companyId,
          since: since ? new Date(since) : undefined,
          limit: Number(searchParams.get('limit')) || undefined,
        })
        return NextResponse.json(result)
      }

      case 'presence': {
        const result = await presenceSnapshot({
          companyId: user.companyId,
          idleThresholdMinutes: Number(searchParams.get('idleThresholdMinutes')) || undefined,
        })
        return NextResponse.json(result)
      }

      case 'price-position': {
        const result = await pricePosition({
          companyId: user.companyId,
          tolerancePct: Number(searchParams.get('tolerancePct')) || undefined,
        })
        return NextResponse.json(result)
      }

      default:
        return bad('action must be one of: quickbooks-sync, presence, price-position')
    }
  } catch (error) {
    console.error('reconcile GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Reconcile query failed' },
      { status: 500 },
    )
  }
}