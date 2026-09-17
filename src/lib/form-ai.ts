import { recordModules } from './workflows/definitions'
import { aiModes } from './workflows/ai-definitions'
import { aiPageFields } from './ai-page-fields'
export type AIField = { key: string; label: string; optional?: boolean; type?: 'number' | 'decimal' | 'integer' | 'date' | 'datetime' | 'time' | 'list'; options?: string[]; prose?: boolean }
export type FormValues = Record<string, string | number>
export const formAIActions = [
  { key: 'all', label: 'Complete form', pending: 'Completing form…', instruction: 'Produce a complete, clear draft across all supported fields.' },
  { key: 'expand', label: 'Add detail', pending: 'Adding detail…', instruction: 'Expand descriptive text into useful structured detail using supplied facts. Include proposed follow-up questions where information is missing; do not invent facts.' },
  { key: 'concise', label: 'Make concise', pending: 'Making concise…', instruction: 'Make descriptive text brief and easy to scan while preserving all important facts and qualifications.' },
  { key: 'professional', label: 'Make professional', pending: 'Refining wording…', instruction: 'Use polished professional wording, clear structure, and precise language without changing factual meaning.' },
  { key: 'friendly', label: 'Make customer-friendly', pending: 'Simplifying wording…', instruction: 'Use warm, plain language a customer can understand. Preserve facts and avoid promises, guarantees, or commitments not in the source.' },
] as const
const field = (key: string, label: string, optional = true, extra: Partial<AIField> = {}): AIField => ({ key, label, optional, ...extra })
const prose = (key: string, label: string, optional = true) => field(key, label, optional, { prose: true })
const notes = prose('notes', 'Notes')
const forms: Record<string, AIField[]> = {
  'ai:quote-generator': [field('jobId','Authorized job',false),field('customerId','Customer',false),field('pricebookItemIds','Pricebook items',false,{type:'list',options:[]}),prose('additionalNotes','Additional notes')],
  jobs: [field('customerId', 'Customer', false), field('propertyId', 'Property', false), field('serviceTypeId', 'Service type'), prose('title', 'Job title', false), prose('description', 'Job description'), field('tradeType', 'Trade', false, { options: ['HVAC', 'PLUMBING', 'ELECTRICAL'] }), field('priority', 'Priority', false, { options: ['LOW', 'NORMAL', 'HIGH', 'EMERGENCY'] }), field('jobType', 'Job type', false, { options: ['SERVICE_CALL', 'MAINTENANCE', 'INSTALLATION', 'REPAIR', 'INSPECTION', 'WARRANTY', 'CALLBACK'] }), field('estimatedDuration', 'Estimated minutes', true, { type: 'number' }), field('scheduledStart', 'Requested start', true, { type: 'datetime' }), field('timeWindowStart', 'Window start', true, { type: 'time' }), field('timeWindowEnd', 'Window end', true, { type: 'time' })],
  customers: [field('firstName', 'First name', false), field('lastName', 'Last name', false), field('companyName', 'Company'), field('email', 'Email'), field('phone', 'Phone', false), field('alternatePhone', 'Alternate phone'), field('preferredContact', 'Contact preference', true, { options: ['PHONE', 'EMAIL', 'TEXT'] }), field('source', 'Lead source', true, { options: ['Website', 'Referral', 'Google', 'Yelp', 'Facebook', 'Walk-in', 'Other'] }), notes, field('propertyAddress', 'Street address', false), field('propertyCity', 'City', false), field('propertyState', 'State', false), field('propertyZip', 'ZIP', false), field('propertyType', 'Property type', true, { options: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'] })],
  parts: [prose('name', 'Part name', false), field('partNumber', 'Part number'), prose('description', 'Description'), field('category', 'Category', true, { options: ['HVAC', 'Plumbing', 'Electrical', 'General'] }), ...['cost', 'price', 'quantity', 'minQuantity'].map(key => field(key, ({cost:'Cost',price:'Price',quantity:'Quantity',minQuantity:'Minimum quantity'})[key]!, true, { type: ['quantity', 'minQuantity'].includes(key) ? 'integer' : 'decimal' })), field('location', 'Storage location'), field('vendor', 'Vendor')],
  technicians: [field('firstName', 'First name', false), field('lastName', 'Last name', false), field('email', 'Email', false), field('phone', 'Phone'), field('employeeId', 'Employee ID'), field('certifications', 'Certifications'), field('truckId', 'Assigned truck'), field('color', 'Calendar color', true, { options: ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#6366F1','#14B8A6'] }), field('tradeTypes', 'Trades', false, {type:'list',options:['HVAC','PLUMBING','ELECTRICAL','GENERAL']})],
  agreements: [field('customerId', 'Customer', false), field('planId', 'Plan', false), field('billingFrequency', 'Billing frequency', false, { options: ['monthly', 'annual'] }), field('startDate', 'Start date', false, { type: 'date' }), field('autoRenew', 'Auto renew', true, { options: ['true', 'false'] }), notes],
  estimates: [prose('title', 'Estimate title'), field('customerId', 'Customer', false), field('jobId', 'Related job'), notes, prose('terms', 'Terms'), prose('goodDescription', 'Good option description'), prose('betterDescription', 'Better option description'), prose('bestDescription', 'Best option description')],
  invoices: [notes, prose('terms', 'Terms')],
  workspace: [field('mode', 'Workflow', false, { options: aiModes.map(m => m.slug) }), field('jobId', 'Authorized job'), field('customerId', 'Customer'), prose('extraInstructions', 'Extra instructions'), prose('notes', 'Question or additional intake notes')],
  'operations:bookings': [field('customerId', 'Customer', false), field('propertyId', 'Property'), field('serviceTypeId', 'Service type', false), prose('title', 'Booking title', false), notes],
  'operations:communications': [field('customerId', 'Customer', false), field('jobId', 'Related job'), prose('subject', 'Subject'), prose('body', 'Message', false)],
}
function getBaseFormFields(form: string): AIField[] {
  if (form.startsWith('workspace:') && Object.hasOwn(aiPageFields,form.slice(10))) return [...forms.workspace.map(f=>f.key==='mode'?{...f,options:[form.slice(10)]}:f),...aiPageFields[form.slice(10)]]
  if (Object.hasOwn(forms, form)) return forms[form]
  const module = form.startsWith('operations:') ? form.slice(11) : ''
  const definition = Object.hasOwn(recordModules, module) ? recordModules[module] : null
  if (!definition) return []
  return [prose('title', 'Title', false), field('customerId', 'Customer'), field('jobId', 'Related job'), ...definition.fields.filter(f => ['text', 'textarea', 'email', 'number', 'money', 'datetime-local', 'select', 'properties', 'equipment', 'serviceTypes', 'vendors'].includes(f.type)).map(f => field(f.key, f.label, !f.required, { prose: f.type === 'textarea', options: f.options, type: f.type === 'number' ? 'integer' : f.type === 'money' ? 'decimal' : f.type === 'datetime-local' ? 'datetime' : undefined }))]
}
export function getFormFields(form: string): AIField[] {
  const fields = getBaseFormFields(form)
  if (!fields.length || fields.some(f=>f.key==='extraInstructions')) return fields
  return [...fields, prose('extraInstructions', 'Extra instructions')]
}
export function selectedAIFields(form: string, action: string): AIField[] {
  const fields = getFormFields(form)
  if (!fields.length) throw new Error('This form does not support AI drafting')
  const selected = formAIActions.some(a => a.key === action) ? fields : action === 'optional' ? fields.filter(f => f.optional) : action === 'polish' ? fields.filter(f => f.prose) : fields.filter(f => f.key === action)
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
    if (v === null || (typeof v === 'string' && !v.trim())) continue
    if (f.type === 'number') {
      if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 1 || v > 1440) throw new Error(`Invalid ${f.label}`)
    } else {
      if (typeof v !== 'string' || !v.trim() || v.length > (f.prose ? 12000 : f.type === 'list' ? 2000 : 500)) throw new Error(`Invalid ${f.label}`)
      if (f.type === 'list' && (!v.split(',').every(item => f.options?.includes(item.trim())) || new Set(v.split(',').map(item => item.trim())).size !== v.split(',').length)) throw new Error(`Invalid ${f.label}`)
      if (f.options && f.type !== 'list' && !f.options.includes(v)) throw new Error(`Invalid ${f.label}`)
      if (f.type === 'decimal' && (!/^\d+(\.\d{1,2})?$/.test(v) || Number(v) > 999999999)) throw new Error(`Invalid ${f.label}`)
      if (f.type === 'integer' && (!/^\d+$/.test(v) || Number(v) > 999999999)) throw new Error(`Invalid ${f.label}`)
      if (f.type === 'date' && (!/^\d{4}-\d\d-\d\d$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0,10) !== v)) throw new Error(`Invalid ${f.label}`)
      if (f.type === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) throw new Error(`Invalid ${f.label}`)
      if (f.type === 'datetime' && (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(v) || !Number.isFinite(Date.parse(v)))) throw new Error(`Invalid ${f.label}`)
    }
    out[f.key] = typeof v === 'string' ? (f.type === 'list' ? v.split(',').map(item => item.trim()).join(',') : v.trim()) : v as number
  }
  return out
}
// Apply only where the user has not edited since this request started.
export function unchangedPatch(current: FormValues, snapshot: FormValues, proposed: FormValues): FormValues {
  return Object.fromEntries(Object.entries(proposed).filter(([key]) => current[key] === snapshot[key]))
}

// The model may explicitly return null, even for draftable text. Supply visible,
// editable starter text for those fields without manufacturing factual values.
export function completeDraftFields(form: string, fields: AIField[], current: FormValues, proposed: FormValues): FormValues {
  const out = {...proposed}
  const workflow = fields.find(f => f.key === 'mode')
  if (workflow && !out.mode) {
    const mode = String(current.mode || '')
    out.mode = workflow.options?.includes(mode) ? mode : workflow.options?.includes('intake') ? 'intake' : workflow.options?.[0] || ''
  }
  const instruction = form === 'workspace' || form.startsWith('workspace:')
    ? aiModes.find(m => m.slug === (out.mode || current.mode))?.instruction
    : undefined
  for (const f of fields) {
    if (out[f.key] !== undefined || !f.prose || String(current[f.key] ?? '').trim()) continue
    out[f.key] = f.key === 'extraInstructions'
      ? `${instruction || 'Use the supplied form details and selected records.'} Identify missing information as questions and keep all suggestions editable for review.`
      : f.key === 'notes' && instruction
        ? `Draft for review: ${instruction}\nConfirm any missing details before taking action.`
        : `Draft for review: [Add ${f.label.toLowerCase()} based on the supplied details]. Confirm any missing information before saving.`
  }
  return out
}

export function missingFormFields(fields: AIField[], values: FormValues): string[] {
  return fields.filter(f => !String(values[f.key] ?? '').trim()).map(f => f.label)
}

export function combineDraftInstructions(notes: string, extraInstructions: string): string {
  if (!extraInstructions || extraInstructions === notes) return notes
  return [notes, `Extra instructions:\n${extraInstructions}`].filter(Boolean).join('\n\n')
}
