/**
 * Subcontractor roster + job referrals.
 *
 * Replaces `gap-no-marketplace-for-sub-contractors`. Deliberately scoped: this
 * is an **internal roster and referral ledger**, not an open two-sided
 * marketplace (no public discovery, no bidding, no payments). That boundary is
 * the honest one — a real marketplace is a separate product with its own trust,
 * insurance and payout obligations.
 *
 * What it does:
 *   - keep a vetted subcontractor roster per company, filtered by trade
 *   - offer a job's scope to a subcontractor and track the response
 *   - record the agreed amount so the margin against the customer quote is
 *     visible before the work is accepted
 */
import { prisma } from '@/lib/prisma'

export const REFERRAL_STATUSES = [
  'offered',
  'accepted',
  'declined',
  'completed',
  'cancelled',
] as const
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number]

const ALLOWED: Record<ReferralStatus, ReferralStatus[]> = {
  offered: ['accepted', 'declined', 'cancelled'],
  accepted: ['completed', 'cancelled'],
  declined: [],
  completed: [],
  cancelled: [],
}

export interface RosterEntry {
  id: string
  companyName: string
  contactName: string | null
  email: string | null
  phone: string | null
  trades: string[]
  serviceArea: string | null
  hourlyRate: number | null
  isActive: boolean
  openReferrals: number
  completedReferrals: number
  /** Accepted ÷ responded, or null when there is no response history. */
  acceptanceRate: number | null
  avgQuote: number | null
  confidence: 'high' | 'medium' | 'insufficient-history'
}

export async function listRoster(input: {
  companyId: string
  tradeType?: string
  activeOnly?: boolean
}): Promise<{ roster: RosterEntry[]; assumptions: string[] }> {
  const subs = await prisma.subcontractor.findMany({
    where: {
      companyId: input.companyId,
      ...(input.activeOnly === false ? {} : { isActive: true }),
    },
    include: { referrals: { select: { status: true, quotedAmount: true, agreedAmount: true } } },
    orderBy: { companyName: 'asc' },
  })

  const roster: RosterEntry[] = []
  for (const s of subs) {
    if (input.tradeType && !s.trades.includes(input.tradeType)) continue

    const responded = s.referrals.filter((r) => r.status !== 'offered')
    const accepted = s.referrals.filter((r) => r.status === 'accepted' || r.status === 'completed')
    const quotes = s.referrals
      .map((r) => Number(r.agreedAmount ?? r.quotedAmount ?? NaN))
      .filter((n) => Number.isFinite(n) && n > 0)

    roster.push({
      id: s.id,
      companyName: s.companyName,
      contactName: s.contactName,
      email: s.email,
      phone: s.phone,
      trades: s.trades,
      serviceArea: s.serviceArea,
      hourlyRate: s.hourlyRate == null ? null : Number(s.hourlyRate),
      isActive: s.isActive,
      openReferrals: s.referrals.filter((r) => r.status === 'offered' || r.status === 'accepted').length,
      completedReferrals: s.referrals.filter((r) => r.status === 'completed').length,
      acceptanceRate: responded.length ? Number((accepted.length / responded.length).toFixed(2)) : null,
      avgQuote: quotes.length ? Number((quotes.reduce((a, b) => a + b, 0) / quotes.length).toFixed(2)) : null,
      confidence:
        responded.length >= 10 ? 'high' : responded.length >= 3 ? 'medium' : 'insufficient-history',
    })
  }

  return {
    roster,
    assumptions: [
      'Acceptance rate is accepted ÷ responded, excluding referrals still in "offered".',
      'avgQuote prefers the agreed amount, falling back to the quoted amount.',
      'Subcontractors with no response history report null rates rather than 0%.',
    ],
  }
}

export interface ReferralView {
  id: string
  status: ReferralStatus
  tradeType: string
  scope: string
  quotedAmount: number | null
  agreedAmount: number | null
  marginAmount: number | null
  marginPct: number | null
  subCompanyName: string
  jobNumber: string | null
  offeredAt: Date
  respondedAt: Date | null
  completedAt: Date | null
  note: string | null
}

export async function createReferral(input: {
  companyId: string
  subId: string
  jobId?: string
  tradeType: string
  scope: string
  quotedAmount?: number
  createdById: string
}): Promise<ReferralView> {
  if (!input.tradeType?.trim()) throw new Error('tradeType is required')
  if (!input.scope?.trim()) throw new Error('scope is required')
  if (input.quotedAmount != null && !(input.quotedAmount >= 0)) {
    throw new Error('quotedAmount must be >= 0')
  }

  const sub = await prisma.subcontractor.findFirst({
    where: { id: input.subId, companyId: input.companyId },
  })
  if (!sub) throw new Error('Subcontractor not found in this company')

  if (input.jobId) {
    const job = await prisma.job.findFirst({ where: { id: input.jobId, companyId: input.companyId } })
    if (!job) throw new Error('Job not found in this company')
  }

  const row = await prisma.subcontractorReferral.create({
    data: {
      companyId: input.companyId,
      subId: input.subId,
      jobId: input.jobId ?? null,
      tradeType: input.tradeType.trim(),
      scope: input.scope.trim(),
      quotedAmount: input.quotedAmount ?? null,
      status: 'offered',
      createdById: input.createdById,
    },
    include: {
      subcontractor: { select: { companyName: true } },
      job: { select: { jobNumber: true } },
    },
  })

  return toView(row)
}

export async function transitionReferral(input: {
  companyId: string
  id: string
  next: ReferralStatus
  agreedAmount?: number
  note?: string
}): Promise<ReferralView> {
  const current = await prisma.subcontractorReferral.findFirst({
    where: { id: input.id, companyId: input.companyId },
    include: {
      subcontractor: { select: { companyName: true } },
      job: { select: { jobNumber: true } },
    },
  })
  if (!current) throw new Error('Referral not found')

  const from = current.status as ReferralStatus
  if (!ALLOWED[from]?.includes(input.next)) {
    throw new Error(`Cannot move a referral from "${from}" to "${input.next}"`)
  }
  if (input.next === 'accepted' && input.agreedAmount != null && !(input.agreedAmount >= 0)) {
    throw new Error('agreedAmount must be >= 0')
  }

  const row = await prisma.subcontractorReferral.update({
    where: { id: current.id },
    data: {
      status: input.next,
      agreedAmount:
        input.next === 'accepted' ? (input.agreedAmount ?? current.agreedAmount) : current.agreedAmount,
      respondedAt: ['accepted', 'declined'].includes(input.next) ? new Date() : current.respondedAt,
      completedAt: input.next === 'completed' ? new Date() : current.completedAt,
      note: input.note ?? current.note,
    },
    include: {
      subcontractor: { select: { companyName: true } },
      job: { select: { jobNumber: true } },
    },
  })

  return toView(row)
}

function toView(row: {
  id: string
  status: string
  tradeType: string
  scope: string
  quotedAmount: unknown
  agreedAmount: unknown
  offeredAt: Date
  respondedAt: Date | null
  completedAt: Date | null
  note: string | null
  subcontractor?: { companyName: string } | null
  job?: { jobNumber: string } | null
}): ReferralView {
  const quoted = row.quotedAmount == null ? null : Number(row.quotedAmount)
  const agreed = row.agreedAmount == null ? null : Number(row.agreedAmount)
  // Margin is only meaningful once a subcontractor has agreed a number.
  const marginAmount = quoted != null && agreed != null ? Number((quoted - agreed).toFixed(2)) : null
  const marginPct =
    marginAmount != null && quoted ? Number(((marginAmount / quoted) * 100).toFixed(2)) : null

  return {
    id: row.id,
    status: row.status as ReferralStatus,
    tradeType: row.tradeType,
    scope: row.scope,
    quotedAmount: quoted,
    agreedAmount: agreed,
    marginAmount,
    marginPct,
    subCompanyName: row.subcontractor?.companyName ?? '',
    jobNumber: row.job?.jobNumber ?? null,
    offeredAt: row.offeredAt,
    respondedAt: row.respondedAt,
    completedAt: row.completedAt,
    note: row.note,
  }
}

export async function listReferrals(input: {
  companyId: string
  status?: ReferralStatus
  subId?: string
  jobId?: string
}): Promise<ReferralView[]> {
  const rows = await prisma.subcontractorReferral.findMany({
    where: {
      companyId: input.companyId,
      ...(input.status ? { status: input.status } : {}),
      ...(input.subId ? { subId: input.subId } : {}),
      ...(input.jobId ? { jobId: input.jobId } : {}),
    },
    include: {
      subcontractor: { select: { companyName: true } },
      job: { select: { jobNumber: true } },
    },
    orderBy: { offeredAt: 'desc' },
    take: 200,
  })
  return rows.map(toView)
}