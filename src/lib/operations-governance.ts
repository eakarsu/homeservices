import crypto from 'crypto'

export interface AuthContext {
  id: string
  role: string
  companyId: string
  technicianId?: string
}

export interface ScopedJob {
  companyId: string
  assignments?: Array<{ technicianId: string }>
}

const OFFICE_ROLES = new Set(['ADMIN', 'MANAGER', 'DISPATCHER', 'OFFICE'])
const ESTIMATE_REVIEW_ROLES = new Set(['ADMIN', 'MANAGER', 'OFFICE'])

export function canReadJob(user: AuthContext, job: ScopedJob): boolean {
  if (job.companyId !== user.companyId) return false
  if (OFFICE_ROLES.has(user.role)) return true
  return user.role === 'TECHNICIAN'
    && !!user.technicianId
    && !!job.assignments?.some(assignment => assignment.technicianId === user.technicianId)
}

export function canEditJob(user: AuthContext, job: ScopedJob): boolean {
  return canReadJob(user, job) && (OFFICE_ROLES.has(user.role) || user.role === 'TECHNICIAN')
}

export function canDeleteJob(user: AuthContext, job: ScopedJob): boolean {
  return job.companyId === user.companyId && ['ADMIN', 'MANAGER'].includes(user.role)
}

const JOB_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['DISPATCHED', 'EN_ROUTE', 'IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
  DISPATCHED: ['EN_ROUTE', 'IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
  EN_ROUTE: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'COMPLETED'],
  ON_HOLD: ['SCHEDULED', 'DISPATCHED', 'EN_ROUTE', 'IN_PROGRESS', 'CANCELLED'],
  COMPLETED: ['INVOICED'],
  CANCELLED: [],
  INVOICED: [],
}

export function isValidJobTransition(current: string, next: string): boolean {
  return current === next || !!JOB_TRANSITIONS[current]?.includes(next)
}

export function canManageEstimate(user: AuthContext): boolean {
  return ESTIMATE_REVIEW_ROLES.has(user.role)
}

export function stableJson(value: unknown): string {
  const normalize = (item: unknown): unknown => {
    if (item instanceof Date) return item.toISOString()
    if (Array.isArray(item)) return item.map(normalize)
    if (item && typeof item === 'object') {
      const jsonValue = 'toJSON' in item && typeof item.toJSON === 'function'
        ? item.toJSON()
        : item
      if (jsonValue !== item) return normalize(jsonValue)
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nested]) => [key, normalize(nested)])
      )
    }
    return item
  }
  return JSON.stringify(normalize(value))
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export function calculateAuditHash(input: {
  companyId: string
  actorId: string | null
  action: string
  entityType: string
  entityId: string
  payload: unknown
  previousHash: string | null
  createdAt: Date
}): string {
  return sha256(stableJson({ ...input, createdAt: input.createdAt.toISOString() }))
}

export function validateAuditChain(events: Array<{
  companyId: string
  actorId: string | null
  action: string
  entityType: string
  entityId: string
  payload: unknown
  previousHash: string | null
  eventHash: string
  createdAt: Date
}>): boolean {
  let previousHash: string | null = null
  for (const event of events) {
    if (event.previousHash !== previousHash) return false
    const expected = calculateAuditHash({
      companyId: event.companyId, actorId: event.actorId, action: event.action,
      entityType: event.entityType, entityId: event.entityId, payload: event.payload,
      previousHash, createdAt: event.createdAt,
    })
    if (event.eventHash !== expected) return false
    previousHash = event.eventHash
  }
  return true
}

export function validateEstimateReview(input: {
  jurisdiction?: unknown
  propertyState?: string | null
  templateSource?: unknown
  templateEffectiveDate?: unknown
  manualPriceReason?: unknown
  hasUnlinkedPrices: boolean
  allowedTemplateHosts: string[]
  now?: Date
}): string[] {
  const blockers: string[] = []
  const now = input.now || new Date()
  const jurisdiction = typeof input.jurisdiction === 'string' ? input.jurisdiction.trim().toUpperCase() : ''
  if (!/^[A-Z]{2}$/.test(jurisdiction)) blockers.push('A two-letter jurisdiction is required')
  if (input.propertyState && jurisdiction !== input.propertyState.trim().toUpperCase()) blockers.push('Jurisdiction must match the service property')

  try {
    const url = new URL(String(input.templateSource || ''))
    if (url.protocol !== 'https:') blockers.push('Template source must use HTTPS')
    if (!input.allowedTemplateHosts.includes(url.hostname.toLowerCase())) blockers.push('Template source host is not allowlisted')
  } catch {
    blockers.push('A valid authoritative template source URL is required')
  }

  const effectiveDate = new Date(String(input.templateEffectiveDate || ''))
  if (Number.isNaN(effectiveDate.getTime())) blockers.push('A valid template effective date is required')
  else if (effectiveDate > now) blockers.push('Template effective date cannot be in the future')

  if (input.hasUnlinkedPrices && (typeof input.manualPriceReason !== 'string' || input.manualPriceReason.trim().length < 20)) {
    blockers.push('A detailed manual price justification is required for non-pricebook items')
  }
  return [...new Set(blockers)]
}

export function validateQuoteDraft(result: unknown, authoritativeSubtotal: number): string[] {
  const blockers: string[] = []
  const quote = result as { options?: Array<Record<string, unknown>> } | null
  if (!quote || !Array.isArray(quote.options) || quote.options.length !== 3) return ['Exactly three quote options are required']
  for (const [index, option] of quote.options.entries()) {
    const labor = Number(option.laborCost)
    const parts = Number(option.partsCost)
    const total = Number(option.totalCost)
    if (![labor, parts, total].every(value => Number.isFinite(value) && value >= 0)) blockers.push(`Option ${index + 1} contains an invalid amount`)
    if (Math.abs(labor + parts - total) > 0.01) blockers.push(`Option ${index + 1} total does not equal labor plus parts`)
    if (authoritativeSubtotal > 0 && (total < authoritativeSubtotal * 0.5 || total > authoritativeSubtotal * 2)) {
      blockers.push(`Option ${index + 1} is outside the allowed pricebook variance`)
    }
  }
  return [...new Set(blockers)]
}

export function approvalTokenHash(token: string): string {
  return sha256(token)
}

export function retentionDate(from: Date, years = 7): Date {
  const retained = new Date(from)
  retained.setUTCFullYear(retained.getUTCFullYear() + years)
  return retained
}
