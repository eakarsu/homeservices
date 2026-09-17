// Match explicit references only; repeated titles/names never select an arbitrary record.
type JobChoice = { id: string; jobNumber: string; title: string; customerId: string }
type CustomerChoice = { id: string; firstName: string | null; lastName: string | null; companyName?: string | null }
const normalize = (s: string) => s.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
export function matchWorkspaceRecords(source: string, jobs: JobChoice[], customers: CustomerChoice[], selected: { jobId: string; customerId: string }) {
  const content = ` ${normalize(source)} `
  const mentions = (value: string) => !!normalize(value) && content.includes(` ${normalize(value)} `)
  let jobId = selected.jobId, customerId = selected.customerId
  if (!customerId && !jobId) {
    const matches = customers.filter(c => mentions([c.firstName, c.lastName].filter(Boolean).join(" ")) || (!!c.companyName && mentions(c.companyName)))
    if (matches.length === 1) customerId = matches[0].id
  }
  if (!jobId) {
    const eligible = jobs.filter(j => !customerId || j.customerId === customerId)
    const numbered = eligible.filter(j => mentions(j.jobNumber))
    const matches = numbered.length ? numbered : eligible.filter(j => mentions(j.title))
    if (matches.length === 1) jobId = matches[0].id
  }
  const job = jobs.find(j => j.id === jobId)
  if (job && !customerId) customerId = job.customerId
  return { jobId, customerId }
}

export function matchNamedRecord(source: string, rows: {id:string;name:string}[]) {
  const content = ` ${normalize(source)} `
  const matches = rows.filter(r => normalize(r.name) && content.includes(` ${normalize(r.name)} `))
  return matches.length === 1 ? matches[0].id : ''
}
