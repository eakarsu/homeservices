/**
 * Subcontractor roster + referrals.
 *
 * Replaces `gap-no-marketplace-for-sub-contractors` with an internal roster and
 * referral ledger. This is deliberately **not** an open marketplace: no public
 * discovery, no bidding, no payouts.
 *
 *   GET  /api/subcontractors?tradeType=…          roster with response history
 *   POST /api/subcontractors                      add a roster entry
 *   GET  /api/subcontractors/referrals?status=…   referral ledger
 *   POST /api/subcontractors/referrals            offer a scope to a subcontractor
 *   POST /api/subcontractors/referrals/:id/transition  accept / decline / complete
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import {
  createReferral,
  listReferrals,
  listRoster,
  transitionReferral,
  REFERRAL_STATUSES,
  type ReferralStatus,
} from '@/lib/workflows/subcontractors'

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return bad('Unauthorized', 401)

    const { searchParams } = new URL(request.url)

    if (searchParams.get('list') === 'referrals') {
      const status = searchParams.get('status') as ReferralStatus | null
      if (status && !REFERRAL_STATUSES.includes(status)) {
        return bad(`status must be one of: ${REFERRAL_STATUSES.join(', ')}`)
      }
      const referrals = await listReferrals({
        companyId: user.companyId,
        status: status ?? undefined,
        subId: searchParams.get('subId') ?? undefined,
        jobId: searchParams.get('jobId') ?? undefined,
      })
      return NextResponse.json({
        referrals,
        statuses: REFERRAL_STATUSES,
        scope: 'Internal roster and referral ledger — not an open marketplace.',
      })
    }

    const result = await listRoster({
      companyId: user.companyId,
      tradeType: searchParams.get('tradeType') ?? undefined,
      activeOnly: searchParams.get('activeOnly') !== 'false',
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('subcontractors GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not list subcontractors' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return bad('Unauthorized', 401)

    const body = await request.json().catch(() => ({}))

    // Create a roster entry
    if (!body.action && body.companyName) {
      if (!String(body.companyName).trim()) return bad('companyName is required')
      const row = await prisma.subcontractor.create({
        data: {
          companyId: user.companyId,
          companyName: String(body.companyName).trim(),
          contactName: body.contactName ?? null,
          email: body.email ?? null,
          phone: body.phone ?? null,
          trades: Array.isArray(body.trades) ? body.trades.map(String) : [],
          serviceArea: body.serviceArea ?? null,
          hourlyRate: body.hourlyRate != null ? Number(body.hourlyRate) : null,
          notes: body.notes ?? null,
        },
      })
      return NextResponse.json(row, { status: 201 })
    }

    // Offer a scope
    if (body.action === 'create-referral' || body.subId) {
      const referral = await createReferral({
        companyId: user.companyId,
        subId: String(body.subId),
        jobId: body.jobId,
        tradeType: String(body.tradeType ?? ''),
        scope: String(body.scope ?? ''),
        quotedAmount: body.quotedAmount != null ? Number(body.quotedAmount) : undefined,
        createdById: user.id,
      })
      return NextResponse.json(referral, { status: 201 })
    }

    return bad('Provide companyName to add a roster entry, or subId to create a referral')
  } catch (error) {
    console.error('subcontractors POST error:', error)
    const message = error instanceof Error ? error.message : 'Could not create'
    return NextResponse.json({ error: message }, { status: /not found|required|must be/i.test(message) ? 400 : 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return bad('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return bad('id is required')

    const body = await request.json().catch(() => ({}))
    const next = body.next as ReferralStatus
    if (!REFERRAL_STATUSES.includes(next)) {
      return bad(`next must be one of: ${REFERRAL_STATUSES.join(', ')}`)
    }

    const referral = await transitionReferral({
      companyId: user.companyId,
      id,
      next,
      agreedAmount: body.agreedAmount != null ? Number(body.agreedAmount) : undefined,
      note: body.note,
    })
    return NextResponse.json(referral)
  } catch (error) {
    console.error('subcontractors PATCH error:', error)
    const message = error instanceof Error ? error.message : 'Could not update referral'
    return NextResponse.json({ error: message }, { status: /Cannot move|not found|must be/i.test(message) ? 409 : 500 })
  }
}