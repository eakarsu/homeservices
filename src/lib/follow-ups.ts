export const followUpStatuses = ['OPEN', 'COMPLETED', 'CANCELLED'] as const
export type ChecklistItem = { text: string; done: boolean }
export function canManageFollowUps(role: string) {
  return ['ADMIN', 'MANAGER', 'DISPATCHER', 'OFFICE'].includes(role)
}
export function objectInput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object')
  return value as Record<string, unknown>
}
export function field(value: unknown, label: string, max: number, required = false): string {
  if (value === undefined && !required) return ''
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error(`${label} is required or too long`)
  return value.trim()
}
export function validateChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value) || value.length > 20) throw new Error('Use up to 20 checklist items')
  return value.map(item => {
    const row = objectInput(item)
    if (typeof row.done !== 'boolean') throw new Error('Invalid checklist completion')
    return { text: field(row.text, 'Checklist text', 500, true), done: row.done }
  })
}
export function validateFollowUp(value: unknown) {
  const row = objectInput(value)
  const status = field(row.status, 'Status', 20, true)
  if (!followUpStatuses.includes(status as typeof followUpStatuses[number])) throw new Error('Invalid status')
  const dueAt = new Date(field(row.dueAt, 'Due date', 40, true))
  if (!Number.isFinite(dueAt.getTime())) throw new Error('Invalid due date')
  const checklist = validateChecklist(row.checklist)
  if (status === 'COMPLETED' && checklist.some(item => !item.done)) throw new Error('Complete every checklist item before completing the task')
  return {
    title: field(row.title, 'Title', 200, true), notes: field(row.notes, 'Notes', 5000),
    messageDraft: field(row.messageDraft, 'Customer message', 5000),
    customerId: field(row.customerId, 'Customer', 100, true),
    jobId: field(row.jobId ?? '', 'Job', 100) || null,
    assigneeId: field(row.assigneeId ?? '', 'Assignee', 100) || null,
    aiResultId: field(row.aiResultId ?? '', 'AI result', 100) || null,
    status, dueAt, checklist,
  }
}
export function validateFollowUpDraft(value: unknown, mode: string) {
  const row = objectInput(value)
  if (!['message', 'checklist', 'all'].includes(mode)) throw new Error('Invalid draft mode')
  const result: { title?: string; notes?: string; messageDraft?: string; checklist?: ChecklistItem[] } = {}
  if (mode === 'all') {
    result.title = field(row.title, 'AI title', 200, true)
    result.notes = field(row.notes, 'AI notes', 5000, true)
  }
  if (mode !== 'checklist') result.messageDraft = field(row.messageDraft, 'AI customer message', 5000, true)
  if (mode !== 'message') {
    if (!Array.isArray(row.checklist) || !row.checklist.length) throw new Error('AI checklist is empty')
    result.checklist = validateChecklist(row.checklist.map(text => ({ text, done: false })))
  }
  return result
}

/** Permit configured origin and development-only loopback aliases on the same port. */
export function validFollowUpOrigin(origin: string | null, configured: string, development: boolean) {
  if (!origin) return true
  try {
    const source = new URL(origin), target = new URL(configured)
    if (source.origin === target.origin) return true
    const loopback = ['localhost', '127.0.0.1', '[::1]']
    return development && loopback.includes(source.hostname) && loopback.includes(target.hostname)
      && source.port === target.port && source.protocol === target.protocol
  } catch { return false }
}
