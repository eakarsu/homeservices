import { recordModules } from './workflows/definitions'
export type AIField = { key: string; label: string; optional?: boolean; type?: 'number' | 'decimal' | 'integer' | 'date' | 'datetime' | 'time'; options?: string[]; prose?: boolean }
export type FormValues = Record<string, string | number>
const field = (key: string, label: string, optional = true, extra: Partial<AIField> = {}): AIField => ({ key, label, optional, ...extra })
const prose = (key: string, label: string, optional = true) => field(key, label, optional, { prose: true })
const notes = prose('notes', 'Notes')
const forms: Record<string, AIField[]> = {
  jobs: [prose('title', 'Job title', false), prose('description', 'Job description'), field('tradeType', 'Trade', false, { options: ['HVAC', 'PLUMBING', 'ELECTRICAL'] }), field('priority', 'Priority', false, { options: ['LOW', 'NORMAL', 'HIGH', 'EMERGENCY'] }), field('jobType', 'Job type', false, { options: ['SERVICE_CALL', 'MAINTENANCE', 'INSTALLATION', 'REPAIR', 'INSPECTION', 'WARRANTY', 'CALLBACK'] }), field('estimatedDuration', 'Estimated minutes', true, { type: 'number' }), field('scheduledStart', 'Requested start', true, { type: 'datetime' }), field('timeWindowStart', 'Window start', true, { type: 'time' }), field('timeWindowEnd', 'Window end', true, { type: 'time' })],
  customers: [field('firstName', 'First name', false), field('lastName', 'Last name', false), field('companyName', 'Company'), field('email', 'Email'), field('phone', 'Phone', false), field('alternatePhone', 'Alternate phone'), field('preferredContact', 'Contact preference', true, { options: ['PHONE', 'EMAIL', 'TEXT'] }), field('source', 'Lead source', true, { options: ['Website', 'Referral', 'Google', 'Yelp', 'Facebook', 'Walk-in', 'Other'] }), notes, field('propertyAddress', 'Street address', false), field('propertyCity', 'City', false), field('propertyState', 'State', false), field('propertyZip', 'ZIP', false), field('propertyType', 'Property type', true, { options: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'] })],
  parts: [prose('name', 'Part name', false), field('partNumber', 'Part number'), prose('description', 'Description'), field('category', 'Category', true, { options: ['HVAC', 'Plumbing', 'Electrical', 'General'] }), ...['cost', 'price', 'quantity', 'minQuantity'].map(key => field(key, ({cost:'Cost',price:'Price',quantity:'Quantity',minQuantity:'Minimum quantity'})[key]!, true, { type: ['quantity', 'minQuantity'].includes(key) ? 'integer' : 'decimal' })), field('location', 'Storage location'), field('vendor', 'Vendor')],
  technicians: [field('firstName', 'First name', false), field('lastName', 'Last name', false), field('email', 'Email', false), field('phone', 'Phone'), field('employeeId', 'Employee ID'), field('certifications', 'Certifications')],
  agreements: [notes],
  estimates: [notes, prose('terms', 'Terms'), prose('goodDescription', 'Good option description'), prose('betterDescription', 'Better option description'), prose('bestDescription', 'Best option description')],
  invoices: [notes, prose('terms', 'Terms')],
  workspace: [prose('notes', 'Question or additional intake notes')],
  'operations:bookings': [prose('title', 'Booking title', false), notes],
  'operations:communications': [prose('subject', 'Subject'), prose('body', 'Message', false)],
}
export function getFormFields(form: string): AIField[] {
  if (Object.hasOwn(forms, form)) return forms[form]
  const module = form.startsWith('operations:') ? form.slice(11) : ''
  const definition = Object.hasOwn(recordModules, module) ? recordModules[module] : null
  if (!definition) return []
  return [prose('title', 'Title', false), ...definition.fields.filter(f => ['text', 'textarea', 'email', 'number', 'money', 'datetime-local', 'select'].includes(f.type)).map(f => field(f.key, f.label, !f.required, { prose: f.type === 'textarea', options: f.options, type: f.type === 'number' ? 'integer' : f.type === 'money' ? 'decimal' : f.type === 'datetime-local' ? 'datetime' : undefined }))]
}
export function selectedAIFields(form: string, action: string): AIField[] {
  const fields = getFormFields(form)
  if (!fields.length) throw new Error('This form does not support AI drafting')
  const selected = action === 'all' ? fields : action === 'optional' ? fields.filter(f => f.optional) : action === 'polish' ? fields.filter(f => f.prose) : fields.filter(f => f.key === action)
  if (!selected.length) throw new Error('Choose an available AI action')
  return selected
}
export function pickFormValues(form: string, value: unknown): FormValues {
  const record = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  return Object.fromEntries(getFormFields(form).flatMap(f => {
    const v = record[f.key]
    return (typeof v === 'string' && v.length <= 12000) || (typeof v === 'number' && Number.isFinite(v)) ? [[f.key, v]] : []
  }))
}
export function validateAIFields(value: unknown, fields: AIField[]): FormValues {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('AI returned invalid form fields')
  const row = value as Record<string, unknown>, out: FormValues = {}
  if (Object.keys(row).some(key => !fields.some(f => f.key === key))) throw new Error('AI returned an unexpected field')
  for (const f of fields) {
    if (!Object.hasOwn(row, f.key)) throw new Error(`AI did not evaluate ${f.label}`)
    const v = row[f.key]
    if (v === null) continue
    if (f.type === 'number') {
      if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 1 || v > 1440) throw new Error(`Invalid ${f.label}`)
    } else {
      if (typeof v !== 'string' || !v.trim() || v.length > (f.prose ? 12000 : 500)) throw new Error(`Invalid ${f.label}`)
      if (f.options && !f.options.includes(v)) throw new Error(`Invalid ${f.label}`)
      if (f.type === 'decimal' && (!/^\d+(\.\d{1,2})?$/.test(v) || Number(v) > 999999999)) throw new Error(`Invalid ${f.label}`)
      if (f.type === 'integer' && (!/^\d+$/.test(v) || Number(v) > 999999999)) throw new Error(`Invalid ${f.label}`)
      if (f.type === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) throw new Error(`Invalid ${f.label}`)
      if (f.type === 'datetime' && (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(v) || !Number.isFinite(Date.parse(v)))) throw new Error(`Invalid ${f.label}`)
    }
    out[f.key] = typeof v === 'string' ? v.trim() : v as number
  }
  return out
}
// Apply only where the user has not edited since this request started.
export function unchangedPatch(current: FormValues, snapshot: FormValues, proposed: FormValues): FormValues {
  return Object.fromEntries(Object.entries(proposed).filter(([key]) => current[key] === snapshot[key]))
}
