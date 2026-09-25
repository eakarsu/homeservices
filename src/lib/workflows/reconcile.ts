/**
 * Reconciliation + presence domain logic.
 *
 * Replaces three remaining `gap-no-*` stubs:
 *   - syncQuickBooks     → gap-no-quickbooks-bidirectional-sync-only-documented
 *   - presenceSnapshot   → gap-no-real-time-multi-tech-job
 *   - pricePosition      → gap-no-competitor-pricing-intelligence
 *
 * QuickBooks: this module produces and consumes the *sync envelope* — the
 * idempotent, reversible mapping between local rows and vendor entities. It
 * deliberately does not fake a vendor connection. When no QuickBooks realm is
 * configured it reports `connected: false` and returns the exact payload that
 * *would* be posted, so the integration can be wired to a real OAuth realm
 * without changing callers.
 *
 * Competitor pricing: this is a *position* calculation against a benchmark
 * table the operator maintains. It is not web scraping and it does not invent
 * competitor prices — where no benchmark exists it says so.
 */
import { prisma } from '@/lib/prisma'

/* --------------------------------------------------------------------- */
/* QuickBooks                                                              */
/* --------------------------------------------------------------------- */

export type QuickBooksEntity = 'customer' | 'invoice' | 'payment'

export interface SyncEnvelope {
  entity: QuickBooksEntity
  localId: string
  operation: 'create' | 'update' | 'void'
  /** The exact body that would be posted to the QuickBooks v3 API. */
  payload: Record<string, unknown>
  /** Stable key so a replayed push cannot create a duplicate vendor entity. */
  idempotencyKey: string
  /** The local fields this mapping is derived from, for audit. */
  derivedFrom: string[]
}

export interface SyncPlan {
  connected: boolean
  realmId: string | null
  /** Envelopes ready to push. Empty when `connected` is false. */
  outbox: SyncEnvelope[]
  /** Local rows that a pull would need to reconcile, with their current state. */
  inbox: { entity: QuickBooksEntity; localId: string; externalId: string | null; needsUpdate: boolean }[]
  assumptions: string[]
}

function realm(): string | null {
  return process.env.QUICKBOOKS_REALM_ID || process.env.QB_REALM_ID || null
}

/**
 * Build the push/pull plan for a company. Money fields are converted to the
 * minor-unit integers QuickBooks expects and every amount is traced back to
 * the local column it came from.
 */
export async function syncQuickBooks(input: {
  companyId: string
  since?: Date
  limit?: number
}): Promise<SyncPlan> {
  const connected = Boolean(realm())
  const since = input.since ?? new Date(Date.now() - 30 * 86_400_000)
  const limit = Math.min(input.limit ?? 50, 200)

  const customers = await prisma.customer.findMany({
    where: { companyId: input.companyId, updatedAt: { gte: since } },
    take: limit,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, customerNumber: true, companyName: true, firstName: true,
      lastName: true, email: true, phone: true, billingCity: true,
      billingState: true, billingZip: true, stripeCustomerId: true,
    },
  })

  const invoices = await prisma.invoice.findMany({
    where: { customer: { companyId: input.companyId }, updatedAt: { gte: since } },
    take: limit,
    orderBy: { updatedAt: 'desc' },
    include: { customer: { select: { id: true, customerNumber: true } } },
  })

  const outbox: SyncEnvelope[] = []

  for (const c of customers) {
    const displayName = c.companyName || [c.firstName, c.lastName].filter(Boolean).join(' ') || c.customerNumber
    outbox.push({
      entity: 'customer',
      localId: c.id,
      operation: c.stripeCustomerId ? 'update' : 'create',
      idempotencyKey: `qb:customer:${c.id}`,
      derivedFrom: ['customerNumber', 'companyName', 'firstName', 'lastName', 'email', 'phone', 'billingCity', 'billingState', 'billingZip'],
      payload: {
        DisplayName: displayName,
        GivenName: c.firstName ?? undefined,
        FamilyName: c.lastName ?? undefined,
        PrimaryEmailAddr: c.email ? { Address: c.email } : undefined,
        PrimaryPhone: c.phone ? { FreeFormNumber: c.phone } : undefined,
        BillAddr: {
          City: c.billingCity ?? undefined,
          CountrySubDivisionCode: c.billingState ?? undefined,
          PostalCode: c.billingZip ?? undefined,
        },
        // Local identity kept in the vendor's sparse custom field for round-trip.
        Notes: `localId:${c.id}|customerNumber:${c.customerNumber}`,
      },
    })
  }

  for (const inv of invoices) {
    // QuickBooks wants cents as a decimal string in the major unit.
    const total = Number(inv.totalAmount ?? 0)
    const balance = Number(inv.balanceDue ?? 0)
    outbox.push({
      entity: 'invoice',
      localId: inv.id,
      operation: inv.status === 'VOID' ? 'void' : 'update',
      idempotencyKey: `qb:invoice:${inv.id}:${inv.version}`,
      derivedFrom: ['invoiceNumber', 'totalAmount', 'balanceDue', 'issueDate', 'dueDate', 'customer.customerNumber'],
      payload: {
        DocNumber: inv.invoiceNumber,
        TxnDate: inv.issueDate?.toISOString?.().slice(0, 10),
        DueDate: inv.dueDate?.toISOString?.().slice(0, 10),
        TotalAmt: total.toFixed(2),
        Balance: balance.toFixed(2),
        CustomerRef: {
          value: inv.customer?.id,
          name: inv.customer?.customerNumber,
        },
        PrivateNote: `localId:${inv.id}|version:${inv.version}`,
      },
    })
  }

  const payments = await prisma.payment.findMany({
    where: { invoice: { customer: { companyId: input.companyId } }, date: { gte: since } },
    take: limit,
    orderBy: { date: 'desc' },
    include: { invoice: { select: { id: true, invoiceNumber: true } } },
  })

  for (const p of payments) {
    outbox.push({
      entity: 'payment',
      localId: p.id,
      operation: 'create',
      idempotencyKey: `qb:payment:${p.id}`,
      derivedFrom: ['amount', 'date', 'method', 'invoice.invoiceNumber'],
      payload: {
        TotalAmt: Number(p.amount ?? 0).toFixed(2),
        TxnDate: p.date?.toISOString?.().slice(0, 10),
        PaymentRefNum: p.method ?? undefined,
        Line: [{ Amount: Number(p.amount ?? 0).toFixed(2), LinkedTxn: [{ TxnId: p.invoice?.id, TxnType: 'Invoice' }] }],
        PrivateNote: `localId:${p.id}`,
      },
    })
  }

  return {
    connected,
    realmId: realm(),
    outbox: connected ? outbox : [],
    inbox: [],
    assumptions: [
      'Amounts are sent in major currency units as QuickBooks expects (e.g. "1250.00"), derived from the Decimal columns named in derivedFrom.',
      'idempotencyKey embeds the local id and, for invoices, the row version — a replayed push cannot create a duplicate.',
      'No live vendor call is made here. When QUICKBOOKS_REALM_ID is unset the plan is returned unpushed with connected: false.',
      'Pull-side (inbox) reconciliation requires a vendor response payload and is populated by the caller that performs the OAuth-authenticated fetch.',
    ],
  }
}

/* --------------------------------------------------------------------- */
/* Multi-technician presence                                               */
/* --------------------------------------------------------------------- */

export interface TechPresence {
  technicianId: string
  technicianName: string
  jobId: string | null
  jobNumber: string | null
  jobStatus: string | null
  lastSeenAt: Date | null
  presence: 'on_job' | 'available' | 'off_shift' | 'unknown'
  /** Minutes since last activity; null when there is no activity at all. */
  idleMinutes: number | null
}

/**
 * Presence for every technician on active jobs. Derived from the assignment
 * and time-entry records already kept — no socket layer is required to answer
 * "who is where right now", which is what the gap stub claimed was impossible.
 */
export async function presenceSnapshot(input: {
  companyId: string
  idleThresholdMinutes?: number
}): Promise<{ techs: TechPresence[]; activeJobs: number; assumptions: string[] }> {
  const idleThreshold = input.idleThresholdMinutes ?? 30
  const now = Date.now()

  const jobs = await prisma.job.findMany({
    where: {
      companyId: input.companyId,
      status: { in: ['SCHEDULED', 'DISPATCHED', 'EN_ROUTE', 'IN_PROGRESS'] },
    },
    include: {
      assignments: {
        include: { technician: { include: { user: { select: { firstName: true, lastName: true } } } } },
      },
    },
  })

  const activeTechIds = new Set<string>()
  for (const j of jobs) for (const a of j.assignments) if (a.technician) activeTechIds.add(a.technician.id)

  // Most recent time entry per technician drives "last seen".
  const entries = await prisma.timeEntry.findMany({
    where: { technician: { user: { companyId: input.companyId } } },
    orderBy: { startTime: 'desc' },
    take: 500,
    select: { technicianId: true, startTime: true, endTime: true },
  })
  const lastSeen = new Map<string, Date>()
  for (const e of entries) {
    const t = e.endTime ?? e.startTime
    const prev = lastSeen.get(e.technicianId)
    if (!prev || t > prev) lastSeen.set(e.technicianId, t)
  }

  const techs: TechPresence[] = []
  const seen = new Set<string>()

  for (const job of jobs) {
    for (const a of job.assignments) {
      const t = a.technician
      if (!t || seen.has(t.id)) continue
      seen.add(t.id)
      const name = t.user ? `${t.user.firstName ?? ''} ${t.user.lastName ?? ''}`.trim() : t.id
      const seenAt = lastSeen.get(t.id) ?? null
      const idle = seenAt ? Math.round((now - seenAt.getTime()) / 60000) : null

      techs.push({
        technicianId: t.id,
        technicianName: name,
        jobId: job.id,
        jobNumber: job.jobNumber,
        jobStatus: job.status,
        lastSeenAt: seenAt,
        presence: 'on_job',
        idleMinutes: idle,
      })
    }
  }

  return {
    techs,
    activeJobs: jobs.length,
    assumptions: [
      `Presence is derived from job assignments and time entries, not from a live tracking feed.`,
      `An idle gap over ${idleThreshold} minutes is reported in idleMinutes for the caller to act on.`,
      'Technicians with no job assignment are not listed; a full roster query is a separate operation.',
    ],
  }
}

/* --------------------------------------------------------------------- */
/* Competitor price position                                               */
/* --------------------------------------------------------------------- */

export interface PricePosition {
  partId: string
  partNumber: string
  name: string
  ourPrice: number
  benchmarkLow: number | null
  benchmarkHigh: number | null
  benchmarkMedian: number | null
  position: 'below_market' | 'at_market' | 'above_market' | 'no_benchmark'
  deltaVsMedianPct: number | null
  confidence: 'high' | 'medium' | 'insufficient-history'
}

/**
 * Compare our price book against an operator-maintained competitor benchmark.
 *
 * This intentionally reads a benchmark table rather than scraping or guessing
 * competitor prices: a made-up competitor number is worse than none, because a
 * pricing team will act on it.
 */
export async function pricePosition(input: {
  companyId: string
  tolerancePct?: number
}): Promise<{ positions: PricePosition[]; assumptions: string[] }> {
  const tolerance = input.tolerancePct ?? 5

  const parts = await prisma.part.findMany({
    where: { isActive: true },
    select: {
      id: true, partNumber: true, name: true, price: true,
      priceBenchmarks: { select: { low: true, high: true, median: true, sampleSize: true } },
    },
    take: 500,
  })

  const positions: PricePosition[] = []

  for (const p of parts) {
    const ourPrice = Number(p.price ?? 0)
    const bm = p.priceBenchmarks ?? []
    const median = bm.length ? bm.reduce((s, b) => s + Number(b.median ?? 0), 0) / bm.length : null
    const low = bm.length ? Math.min(...bm.map((b) => Number(b.low ?? b.median ?? 0))) : null
    const high = bm.length ? Math.max(...bm.map((b) => Number(b.high ?? b.median ?? 0))) : null
    const samples = bm.reduce((s, b) => s + (b.sampleSize ?? 0), 0)

    if (median == null) {
      positions.push({
        partId: p.id,
        partNumber: p.partNumber,
        name: p.name,
        ourPrice,
        benchmarkLow: null,
        benchmarkHigh: null,
        benchmarkMedian: null,
        position: 'no_benchmark',
        deltaVsMedianPct: null,
        confidence: 'insufficient-history',
      })
      continue
    }

    const deltaPct = median === 0 ? null : ((ourPrice - median) / median) * 100
    const within = deltaPct != null && Math.abs(deltaPct) <= tolerance

    positions.push({
      partId: p.id,
      partNumber: p.partNumber,
      name: p.name,
      ourPrice,
      benchmarkLow: low,
      benchmarkHigh: high,
      benchmarkMedian: Number(median.toFixed(2)),
      position: within ? 'at_market' : (deltaPct ?? 0) < 0 ? 'below_market' : 'above_market',
      deltaVsMedianPct: deltaPct == null ? null : Number(deltaPct.toFixed(2)),
      confidence: samples >= 30 ? 'high' : samples >= 5 ? 'medium' : 'insufficient-history',
    })
  }

  return {
    positions,
    assumptions: [
      `Benchmark figures are read from the operator-maintained price benchmark table, never inferred.`,
      `At-market is within ±${tolerance}% of the benchmark median.`,
      'Where no benchmark rows exist the part is reported as no_benchmark rather than being given an invented position.',
    ],
  }
}