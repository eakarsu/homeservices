/**
 * Field-operations domain logic.
 *
 * Replaces five `gap-no-*` stubs that logged "this is missing" while the data
 * needed to answer each question already existed in the schema. Everything
 * here is **deterministic arithmetic over real rows** — no model calls, no
 * sample data, no `Math.random()`. Where the data is too thin to support a
 * number, the function says so instead of inventing one.
 *
 *   - payrollExport        → gap-no-technician-timesheet-payroll-exports
 *   - reorderSuggestions   → gap-no-parts-auto-replenish-ai-predictive
 *   - recordFleetPing      → gap-no-fleet-gps-tracking-despite-trucks
 *   - ingestFuelCard       → gap-no-fuel-card-fleet-card-integrations
 *   - summariseNps         → gap-no-post-job-feedback-nps-ai
 *   - classifyWarranty     → gap-no-automated-warranty-claim-processing
 *   - safetyQualitySignals → gap-no-technician-safety-quality-real-time
 */
import { prisma } from '@/lib/prisma'

export interface ExportRow {
  technicianId: string
  technicianName: string
  weekStarting: string
  regularMinutes: number
  overtimeMinutes: number
  totalMinutes: number
  jobCount: number
  billableMinutes: number
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const OVERTIME_WEEKLY_MINUTES = 40 * 60

function startOfWeek(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = (x.getDay() + 6) % 7 // Monday = 0
  x.setDate(x.getDate() - day)
  return x
}

/**
 * Timesheet → payroll rows, grouped per technician per ISO week.
 * Overtime is computed against the 40h weekly threshold, which is the only
 * rule we can apply without knowing the pay period or jurisdiction. The export
 * states this so a payroll operator can adjust it.
 */
export async function payrollExport(input: {
  companyId: string
  from: Date
  to: Date
  overtimeThresholdMinutes?: number
}): Promise<{ rows: ExportRow[]; assumptions: string[]; totals: ExportRow }> {
  const threshold = input.overtimeThresholdMinutes ?? OVERTIME_WEEKLY_MINUTES

  const entries = await prisma.timeEntry.findMany({
    where: {
      job: { companyId: input.companyId },
      startTime: { gte: input.from, lte: input.to },
    },
    include: {
      job: { select: { id: true, jobNumber: true } },
      technician: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
    orderBy: { startTime: 'asc' },
  })

  const buckets = new Map<string, ExportRow & { _jobs: Set<string> }>()

  for (const e of entries) {
    const tech = e.technician
    if (!tech) continue
    const name = tech.user
      ? `${tech.user.firstName ?? ''} ${tech.user.lastName ?? ''}`.trim()
      : tech.id

    const minutes =
      e.duration ??
      (e.endTime ? Math.max(0, Math.round((e.endTime.getTime() - e.startTime.getTime()) / 60000)) : 0)
    if (minutes <= 0) continue

    const week = startOfWeek(e.startTime).toISOString().slice(0, 10)
    const key = `${tech.id}|${week}`
    let row = buckets.get(key)
    if (!row) {
      row = {
        technicianId: tech.id,
        technicianName: name,
        weekStarting: week,
        regularMinutes: 0,
        overtimeMinutes: 0,
        totalMinutes: 0,
        jobCount: 0,
        billableMinutes: 0,
        _jobs: new Set<string>(),
      }
      buckets.set(key, row)
    }
    row.totalMinutes += minutes
    row.billableMinutes += e.type === 'WORK' ? minutes : 0
    if (e.job) row._jobs.add(e.job.id)
  }

  const rows: ExportRow[] = []
  for (const row of buckets.values()) {
    row.regularMinutes = Math.min(row.totalMinutes, threshold)
    row.overtimeMinutes = Math.max(0, row.totalMinutes - threshold)
    row.jobCount = row._jobs.size
    rows.push({ ...row })
    delete (row as unknown as Record<string, unknown>)._jobs
  }

  rows.sort((a, b) =>
    a.weekStarting === b.weekStarting
      ? a.technicianName.localeCompare(b.technicianName)
      : a.weekStarting.localeCompare(b.weekStarting),
  )

  const totals: ExportRow = rows.reduce(
    (acc, r) => ({
      technicianId: '',
      technicianName: 'TOTAL',
      weekStarting: '',
      regularMinutes: acc.regularMinutes + r.regularMinutes,
      overtimeMinutes: acc.overtimeMinutes + r.overtimeMinutes,
      totalMinutes: acc.totalMinutes + r.totalMinutes,
      jobCount: acc.jobCount + r.jobCount,
      billableMinutes: acc.billableMinutes + r.billableMinutes,
    }),
    {
      technicianId: '', technicianName: 'TOTAL', weekStarting: '',
      regularMinutes: 0, overtimeMinutes: 0, totalMinutes: 0, jobCount: 0, billableMinutes: 0,
    },
  )

  return {
    rows,
    totals,
    assumptions: [
      `Overtime threshold applied at ${threshold} minutes per technician per week (Monday-start).`,
      'Jurisdiction-specific rules (daily overtime, double time, holiday premiums) are NOT applied.',
      'Duration is taken from the recorded duration field, or computed from start/end where absent.',
      'Non-WORK time entry types are excluded from billable minutes but included in total minutes.',
    ],
  }
}

/** Render the export as CSV. BOM-free, RFC4180 quoting. */
export function toCsv(rows: ExportRow[], totals: ExportRow): string {
  const header = [
    'technician_id', 'technician_name', 'week_starting',
    'regular_minutes', 'overtime_minutes', 'total_minutes',
    'job_count', 'billable_minutes',
  ]
  const escape = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const line = (r: ExportRow) =>
    [r.technicianId, r.technicianName, r.weekStarting, r.regularMinutes,
     r.overtimeMinutes, r.totalMinutes, r.jobCount, r.billableMinutes]
      .map(escape).join(',')

  return [header.join(','), ...rows.map(line), line(totals)].join('\n')
}

/* --------------------------------------------------------------------- */
/* Parts replenishment                                                     */
/* --------------------------------------------------------------------- */

export interface ReorderSuggestion {
  partId: string
  partNumber: string
  name: string
  quantityOnHand: number
  reorderLevel: number
  reorderQty: number
  consumed90d: number
  avgWeeklyUsage: number
  weeksOfCover: number | null
  suggestedOrderQty: number
  reason: string
  confidence: 'high' | 'medium' | 'insufficient-history'
}

/**
 * Reorder suggestions from actual consumption (JobPart usage), not from a
 * model. Where fewer than `minSamples` distinct usage days exist the suggestion
 * is flagged `insufficient-history` rather than presenting a number as fact.
 */
export async function reorderSuggestions(input: {
  companyId: string
  lookbackDays?: number
  targetWeeksCover?: number
  minSamples?: number
}): Promise<{ suggestions: ReorderSuggestion[]; assumptions: string[] }> {
  const lookbackDays = input.lookbackDays ?? 90
  const targetWeeksCover = input.targetWeeksCover ?? 6
  const minSamples = input.minSamples ?? 3
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)

  const parts = await prisma.part.findMany({
    where: { isActive: true },
    include: {
      // JobPart has no timestamp of its own; the job's created date is the
      // closest honest proxy for when the part was consumed.
      jobParts: {
        include: { job: { select: { createdAt: true, companyId: true } } },
      },
    },
  })

  const suggestions: ReorderSuggestion[] = []

  for (const part of parts) {
    const usages = part.jobParts.filter(
      (u) => u.job?.companyId === input.companyId && u.job.createdAt >= since,
    )
    const consumed = usages.reduce((s, u) => s + (u.quantity || 0), 0)
    const distinctDays = new Set(
      usages.map((u) => u.job.createdAt.toISOString().slice(0, 10)),
    ).size
    const weeks = lookbackDays / 7
    const avgWeeklyUsage = consumed / weeks

    const belowReorder = part.quantityOnHand <= part.reorderLevel
    const sampleOk = distinctDays >= minSamples
    const weeksOfCover =
      avgWeeklyUsage > 0 ? part.quantityOnHand / avgWeeklyUsage : null

    // Suggest enough to reach the target cover, at the part's own order multiple.
    const targetQty = Math.ceil(avgWeeklyUsage * targetWeeksCover)
    let suggested = Math.max(0, targetQty - part.quantityOnHand)
    if (part.reorderQty > 0 && suggested > 0) {
      suggested = Math.ceil(suggested / part.reorderQty) * part.reorderQty
    }

    if (!belowReorder && (weeksOfCover ?? Infinity) > targetWeeksCover) continue

    suggestions.push({
      partId: part.id,
      partNumber: part.partNumber,
      name: part.name,
      quantityOnHand: part.quantityOnHand,
      reorderLevel: part.reorderLevel,
      reorderQty: part.reorderQty,
      consumed90d: consumed,
      avgWeeklyUsage: Number(avgWeeklyUsage.toFixed(2)),
      weeksOfCover: weeksOfCover == null ? null : Number(weeksOfCover.toFixed(2)),
      suggestedOrderQty: sampleOk ? suggested : 0,
      reason: belowReorder
        ? `On hand (${part.quantityOnHand}) is at or below reorder level (${part.reorderLevel}).`
        : `Only ${weeksOfCover == null ? 'no' : weeksOfCover.toFixed(1)} weeks of cover at current usage.`,
      confidence: sampleOk ? (distinctDays >= 10 ? 'high' : 'medium') : 'insufficient-history',
    })
  }

  suggestions.sort((a, b) => {
    const rank = (s: ReorderSuggestion) =>
      s.confidence === 'insufficient-history' ? 2 : s.weeksOfCover ?? 99
    return rank(a) - rank(b)
  })

  return {
    suggestions,
    assumptions: [
      `Usage measured over the trailing ${lookbackDays} days from job part consumption.`,
      `Suggestions are suppressed below ${minSamples} distinct usage days and reported as insufficient-history.`,
      `Target cover is ${targetWeeksCover} weeks; order quantities rounded up to the part's reorder multiple.`,
      'No supplier lead time or price break data is applied — add it before raising purchase orders automatically.',
    ],
  }
}

/* --------------------------------------------------------------------- */
/* Fleet: GPS pings + fuel card                                            */
/* --------------------------------------------------------------------- */

export interface FleetPing {
  truckId: string
  latitude: number
  longitude: number
  recordedAt: Date
  speedMph?: number
  headingDeg?: number
  source?: string
}

/**
 * Store a GPS position. Validation is explicit: a ping with a plausible
 * latitude/longitude but no timestamp is rejected rather than silently stamped,
 * so downstream ETA maths cannot mix real and invented times.
 */
export async function recordFleetPing(
  companyId: string,
  ping: FleetPing,
): Promise<{ accepted: true; id: string } | { accepted: false; reason: string }> {
  if (!Number.isFinite(ping.latitude) || ping.latitude < -90 || ping.latitude > 90) {
    return { accepted: false, reason: 'latitude must be between -90 and 90' }
  }
  if (!Number.isFinite(ping.longitude) || ping.longitude < -180 || ping.longitude > 180) {
    return { accepted: false, reason: 'longitude must be between -180 and 180' }
  }
  const recordedAt = new Date(ping.recordedAt)
  if (Number.isNaN(recordedAt.getTime())) {
    return { accepted: false, reason: 'recordedAt must be a valid timestamp' }
  }
  if (recordedAt.getTime() > Date.now() + 60_000) {
    return { accepted: false, reason: 'recordedAt cannot be in the future' }
  }

  const truck = await prisma.truck.findFirst({
    where: { id: ping.truckId, companyId },
  })
  if (!truck) return { accepted: false, reason: 'truck not found in this company' }

  const row = await prisma.fleetPing.create({
    data: {
      truckId: ping.truckId,
      latitude: ping.latitude,
      longitude: ping.longitude,
      recordedAt,
      speedMph: ping.speedMph ?? null,
      headingDeg: ping.headingDeg ?? null,
      source: ping.source ?? 'manual',
    },
  })
  return { accepted: true, id: row.id }
}

export interface FuelCardEntry {
  truckId: string
  cardLast4: string
  vendor: string
  fuelType: string
  gallons: number
  amount: number
  odometer?: number
  purchasedAt: Date
  externalRef: string
}

/**
 * Ingest one fuel-card transaction. `externalRef` is the idempotency key: a
 * replayed card statement line must not double-count fuel spend.
 */
export async function ingestFuelCard(
  companyId: string,
  entry: FuelCardEntry,
): Promise<{ status: 'created' | 'duplicate'; id: string; costPerGallon: number | null }> {
  const purchasedAt = new Date(entry.purchasedAt)
  if (Number.isNaN(purchasedAt.getTime())) {
    throw new Error('purchasedAt must be a valid timestamp')
  }
  if (!(entry.gallons > 0)) throw new Error('gallons must be > 0')
  if (!(entry.amount >= 0)) throw new Error('amount must be >= 0')

  const truck = await prisma.truck.findFirst({ where: { id: entry.truckId, companyId } })
  if (!truck) throw new Error('truck not found in this company')

  const existing = await prisma.fuelTransaction.findUnique({
    where: { externalRef: entry.externalRef },
  })
  if (existing) {
    return {
      status: 'duplicate',
      id: existing.id,
      costPerGallon: entry.gallons > 0 ? Number((entry.amount / entry.gallons).toFixed(4)) : null,
    }
  }

  const row = await prisma.fuelTransaction.create({
    data: {
      truckId: entry.truckId,
      cardLast4: String(entry.cardLast4).slice(-4),
      vendor: entry.vendor,
      fuelType: entry.fuelType,
      gallons: entry.gallons,
      amount: entry.amount,
      odometer: entry.odometer ?? null,
      purchasedAt,
      externalRef: entry.externalRef,
    },
  })

  return {
    status: 'created',
    id: row.id,
    costPerGallon: entry.gallons > 0 ? Number((entry.amount / entry.gallons).toFixed(4)) : null,
  }
}

/* --------------------------------------------------------------------- */
/* Post-job feedback / NPS                                                 */
/* --------------------------------------------------------------------- */

export interface NpsSummary {
  responses: number
  promoters: number
  passives: number
  detractors: number
  /** Standard NPS: %promoters − %detractors, in −100..100. */
  score: number | null
  averageRating: number | null
  confidence: 'high' | 'medium' | 'insufficient-history'
  trend: 'improving' | 'stable' | 'declining' | 'unknown'
}

/**
 * NPS over recorded survey responses. NPS is a real, defined metric
 * (%promoters − %detractors on a 0–10 scale) so it is computed exactly; no
 * sentiment model is involved. Free-text themes are left to the caller.
 */
export async function summariseNps(input: {
  companyId: string
  from?: Date
  to?: Date
}): Promise<NpsSummary> {
  const where: Record<string, unknown> = { companyId: input.companyId }
  if (input.from || input.to) {
    where.createdAt = {
      ...(input.from ? { gte: input.from } : {}),
      ...(input.to ? { lte: input.to } : {}),
    }
  }

  const rows = await prisma.feedbackResponse.findMany({ where })

  let promoters = 0, passives = 0, detractors = 0, ratingSum = 0
  for (const r of rows) {
    const score = r.npsScore
    if (typeof score !== 'number') continue
    if (score >= 9) promoters++
    else if (score >= 7) passives++
    else detractors++
    if (typeof r.rating === 'number') ratingSum += r.rating
  }

  const n = promoters + passives + detractors
  const score = n > 0 ? Math.round(((promoters - detractors) / n) * 100) : null

  // Trend: compare the second half of the window to the first.
  let trend: NpsSummary['trend'] = 'unknown'
  if (n >= 8) {
    const mid = new Date((input.from ?? rows[0]?.createdAt ?? new Date()).getTime())
    const scored = rows
      .filter((r) => typeof r.npsScore === 'number')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const half = Math.floor(scored.length / 2)
    const bucket = (slice: typeof scored) => {
      const p = slice.filter((r) => (r.npsScore as number) >= 9).length
      const d = slice.filter((r) => (r.npsScore as number) < 7).length
      return slice.length ? ((p - d) / slice.length) * 100 : 0
    }
    const earlier = bucket(scored.slice(0, half))
    const later = bucket(scored.slice(half))
    void mid
    trend = later - earlier > 5 ? 'improving' : earlier - later > 5 ? 'declining' : 'stable'
  }

  return {
    responses: n,
    promoters,
    passives,
    detractors,
    score,
    averageRating: rows.length ? Number((ratingSum / rows.length).toFixed(2)) : null,
    confidence: n >= 30 ? 'high' : n >= 10 ? 'medium' : 'insufficient-history',
    trend,
  }
}

/* --------------------------------------------------------------------- */
/* Warranty claim classification                                           */
/* --------------------------------------------------------------------- */

export interface WarrantyAssessment {
  covered: boolean | null
  reason: string
  evidence: string[]
  confidence: 'high' | 'medium' | 'insufficient-history'
}

/**
 * Decide whether a repair is plausibly under warranty from the equipment's
 * install date and the service history around it. This is a rules engine, not
 * a model: the decision is traceable to the rows it used.
 */
export async function classifyWarranty(input: {
  companyId: string
  equipmentId: string
  failureDate: Date
  warrantyMonths?: number
}): Promise<WarrantyAssessment> {
  const months = input.warrantyMonths ?? 12

  // Equipment is scoped to a company through its property → customer chain,
  // and its service history is a separate model keyed by equipmentId.
  const equipment = await prisma.equipment.findFirst({
    where: { id: input.equipmentId, property: { customer: { companyId: input.companyId } } },
  })
  if (!equipment) {
    return {
      covered: null,
      reason: 'Equipment not found in this company.',
      evidence: [],
      confidence: 'insufficient-history',
    }
  }

  const history = await prisma.serviceHistory.findMany({
    where: { equipmentId: equipment.id },
    orderBy: { date: 'desc' },
    take: 10,
    select: { id: true, date: true, description: true, type: true },
  })

  const describe = `Equipment ${[equipment.brand, equipment.model].filter(Boolean).join(' ')}`.trim()
  const evidence: string[] = []
  const failure = new Date(input.failureDate)
  if (Number.isNaN(failure.getTime())) {
    return {
      covered: null,
      reason: 'failureDate must be a valid timestamp.',
      evidence: [describe],
      confidence: 'insufficient-history',
    }
  }
  const failureIso = failure.toISOString().slice(0, 10)

  // An explicit recorded warranty expiry is authoritative; fall back to
  // installDate + warrantyMonths only when it is absent.
  const expiry = equipment.warrantyExpires ? new Date(equipment.warrantyExpires) : null
  const install = equipment.installDate ? new Date(equipment.installDate) : null

  for (const s of history.slice(0, 3)) {
    evidence.push(`Prior service ${s.date.toISOString().slice(0, 10)}: ${s.description || s.type}`)
  }

  if (expiry) {
    evidence.push(`Recorded warranty expiry ${expiry.toISOString().slice(0, 10)}`)
    const covered = failure.getTime() <= expiry.getTime()
    return {
      covered,
      reason: covered
        ? `Failure on ${failureIso} is on or before the recorded warranty expiry ${expiry.toISOString().slice(0, 10)}.`
        : `Failure on ${failureIso} is after the recorded warranty expiry ${expiry.toISOString().slice(0, 10)}.`,
      evidence,
      confidence: 'high',
    }
  }

  if (!install) {
    return {
      covered: null,
      reason: 'Equipment has neither a recorded warranty expiry nor an install date.',
      evidence,
      confidence: 'insufficient-history',
    }
  }

  const ageMonths = (failure.getTime() - install.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
  evidence.push(`Install date ${install.toISOString().slice(0, 10)}`)
  evidence.push(`Age at failure ${ageMonths.toFixed(1)} months against an assumed ${months}-month warranty`)

  if (ageMonths < 0) {
    return {
      covered: null,
      reason: 'Failure date precedes the install date; correct the records before deciding.',
      evidence,
      confidence: 'insufficient-history',
    }
  }

  const recentService = history.find(
    (s) => failure.getTime() - s.date.getTime() < 90 * 24 * 60 * 60 * 1000,
  )

  if (ageMonths > months) {
    return {
      covered: false,
      reason: `Unit is ${ageMonths.toFixed(1)} months old at failure, outside the assumed ${months}-month window.`,
      evidence,
      confidence: 'medium',
    }
  }

  return {
    covered: true,
    reason:
      `Failure occurred ${ageMonths.toFixed(1)} months into an assumed ${months}-month window` +
      (recentService ? `; a recent service record exists — confirm it is not a prior warranty claim.` : '.'),
    evidence,
    confidence: recentService ? 'medium' : 'medium',
  }
}

/* --------------------------------------------------------------------- */
/* Technician safety / quality signals                                     */
/* --------------------------------------------------------------------- */

export interface SafetySignal {
  technicianId: string
  technicianName: string
  jobsLast30d: number
  incompleteJobs: number
  reopenedJobs: number
  missingPhotoEvidence: number
  avgCompletionDays: number | null
  flags: string[]
  risk: 'low' | 'medium' | 'high'
}

/**
 * Safety/quality signals computed from job completion and evidence records.
 * Every flag maps to a counted condition, so a supervisor can see exactly why
 * a technician was flagged.
 */
export async function safetyQualitySignals(input: {
  companyId: string
  windowDays?: number
}): Promise<{ signals: SafetySignal[]; assumptions: string[] }> {
  const windowDays = input.windowDays ?? 30
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

  const jobs = await prisma.job.findMany({
    where: { companyId: input.companyId, createdAt: { gte: since } },
    include: {
      assignments: { include: { technician: { include: { user: { select: { firstName: true, lastName: true } } } } } },
      photos: { select: { id: true } },
    },
  })

  const byTech = new Map<string, SafetySignal & { _completionDays: number[] }>()

  for (const job of jobs) {
    for (const a of job.assignments) {
      const t = a.technician
      if (!t) continue
      const name = t.user ? `${t.user.firstName ?? ''} ${t.user.lastName ?? ''}`.trim() : t.id
      let s = byTech.get(t.id)
      if (!s) {
        s = {
          technicianId: t.id,
          technicianName: name,
          jobsLast30d: 0,
          incompleteJobs: 0,
          reopenedJobs: 0,
          missingPhotoEvidence: 0,
          avgCompletionDays: null,
          flags: [],
          risk: 'low',
          _completionDays: [],
        }
        byTech.set(t.id, s)
      }

      s.jobsLast30d++
      if (job.status !== 'COMPLETED' && job.status !== 'CANCELLED') s.incompleteJobs++
      if (job.status === 'ON_HOLD') s.reopenedJobs++
      if (job.status === 'COMPLETED' && job.photos.length === 0) s.missingPhotoEvidence++

      if (job.scheduledStart && job.actualStart) {
        const days = (job.actualStart.getTime() - job.scheduledStart.getTime()) / 86_400_000
        if (days >= 0) s._completionDays.push(days)
      }
    }
  }

  const signals: SafetySignal[] = []
  for (const s of byTech.values()) {
    const d = s._completionDays
    s.avgCompletionDays = d.length
      ? Number((d.reduce((a, b) => a + b, 0) / d.length).toFixed(2))
      : null

    if (s.missingPhotoEvidence > 0) {
      s.flags.push(`${s.missingPhotoEvidence} completed job(s) with no photo evidence`)
    }
    if (s.reopenedJobs > 0) s.flags.push(`${s.reopenedJobs} job(s) on hold`)
    if (s.incompleteJobs > Math.max(2, s.jobsLast30d * 0.4)) {
      s.flags.push(`High incomplete rate: ${s.incompleteJobs} of ${s.jobsLast30d}`)
    }

    s.risk =
      s.flags.length >= 3 ? 'high' : s.flags.length >= 1 ? 'medium' : 'low'

    delete (s as unknown as Record<string, unknown>)._completionDays
    signals.push({ ...s })
  }

  signals.sort((a, b) => (a.risk === b.risk ? a.technicianName.localeCompare(b.technicianName) : a.risk === 'high' ? -1 : b.risk === 'high' ? 1 : 0))

  return {
    signals,
    assumptions: [
      `Signals computed over the trailing ${windowDays} days from job and photo records.`,
      'Flags are counted conditions, not model judgements; each one names the rows it counted.',
      'No wearable, telematics or incident-report data is included.',
    ],
  }
}