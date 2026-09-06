'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { canManageFollowUps, ChecklistItem } from '@/lib/follow-ups'
import { SparklesIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'

type Person = { id: string; firstName: string | null; lastName: string | null; companyName?: string | null; doNotCall?: boolean; doNotEmail?: boolean; doNotText?: boolean }
type Job = { id: string; customerId: string; title: string; jobNumber: string }
type Task = { id?: string; version?: number; title: string; notes: string; customerId: string; jobId: string; assigneeId: string; dueAt: string; status: string; messageDraft: string; checklist: ChecklistItem[]; aiResultId: string; customer?: Person; job?: Job; assignee?: Person }
const name = (person?: Person) => person ? ([person.firstName, person.lastName].filter(Boolean).join(' ') || person.companyName || 'Customer') : 'Unassigned'
const localDate = (value: string) => { const d = new Date(value); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
const blank = (): Task => ({ title: '', notes: '', customerId: '', jobId: '', assigneeId: '', dueAt: localDate(new Date(Date.now() + 86400000).toISOString()), status: 'OPEN', messageDraft: '', checklist: [], aiResultId: '' })
async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { cache: 'no-store', ...init })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error || 'Unable to complete request')
  return body
}
export default function FollowUpsPage() {
  const { data: session } = useSession()
  const allowed = !!session && canManageFollowUps(session.user.role)
  const client = useQueryClient()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [overdue, setOverdue] = useState(false)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Task | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [model, setModel] = useState('')
  const options = useQuery({ queryKey: ['follow-up-options'], enabled: allowed, queryFn: () => json<{ customers: Person[]; jobs: Job[]; assignees: Person[] }>('/api/follow-ups?options=1') })
  const tasks = useQuery({ queryKey: ['follow-ups', status, search, overdue, page], enabled: allowed, queryFn: () => json<{ data: Task[]; pagination: { total: number; totalPages: number }; counts: { open: number; overdue: number; completed: number } }>(`/api/follow-ups?${new URLSearchParams({ status, search, overdue: overdue ? '1' : '0', page: String(page) })}`) })
  function edit(task?: Task) {
    setEditing(task ? { ...task, jobId: task.jobId || '', assigneeId: task.assigneeId || '', aiResultId: task.aiResultId || '', dueAt: localDate(task.dueAt), checklist: task.checklist.map(item => ({ ...item })) } : blank())
    setError(''); setNotice(''); setModel('')
  }
  function patch(value: Partial<Task>) { setEditing(current => current ? { ...current, ...value } : current) }
  async function save() {
    if (!editing) return
    setBusy('save'); setError(''); setNotice('')
    try {
      await json('/api/follow-ups', { method: editing.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editing, dueAt: new Date(editing.dueAt).toISOString() }) })
      setEditing(null); setNotice('Follow-up saved. Customer message remains a draft.')
      await client.invalidateQueries({ queryKey: ['follow-ups'] })
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') } finally { setBusy('') }
  }
  async function draft(mode: string) {
    if (!editing) return
    setBusy(mode); setError(''); setNotice('')
    try {
      const result = await json<Partial<Task> & { model: string }>('/api/follow-ups/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: editing.customerId, jobId: editing.jobId, title: editing.title, notes: editing.notes, mode }) })
      const { model: providerModel, ...fields } = result
      patch(fields); setModel(providerModel); setNotice('AI draft filled in. Review and edit it, then save the follow-up.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Draft failed') } finally { setBusy('') }
  }
  const selected = options.data?.customers.find(c => c.id === editing?.customerId)
  if (session && !allowed) return <div className="card">Follow-ups are managed by office staff.</div>
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardDocumentCheckIcon className="w-7 h-7 text-primary-600" />Follow-ups</h1><p className="text-gray-500 mt-1">Track customer follow-up work and prepare messages for review.</p></div>
      {editing ? <button className="btn-secondary" disabled={!!busy} onClick={() => { setEditing(null); setError(''); setNotice('') }}>Back to follow-ups</button> : <button className="btn-primary" onClick={() => edit()} disabled={!options.data}>New follow-up</button>}
    </div>
    {(error || options.error || tasks.error) && <div role="alert" className="p-4 bg-red-50 text-red-800 rounded-lg">{error || options.error?.message || tasks.error?.message}</div>}
    {notice && <div role="status" className="p-4 bg-green-50 text-green-800 rounded-lg">{notice}</div>}
    {editing ? <form className="card space-y-5" onSubmit={event => { event.preventDefault(); void save() }}>
      <h2 className="text-lg font-semibold">{editing.id ? 'Edit follow-up' : 'New follow-up'}</h2>
      <fieldset disabled={!!busy} className="space-y-5 disabled:opacity-75">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="space-y-1">Customer<select required aria-label="Customer" className="input w-full" value={editing.customerId} onChange={e => patch({ customerId: e.target.value, jobId: '', aiResultId: '', title: '', notes: '', messageDraft: '', checklist: [] })}><option value="">Select customer</option>{options.data?.customers.map(c => <option key={c.id} value={c.id}>{name(c)}</option>)}</select></label>
          <label className="space-y-1">Related job (optional)<select aria-label="Related job" className="input w-full" value={editing.jobId} onChange={e => patch({ jobId: e.target.value, aiResultId: '' })}><option value="">No linked job</option>{options.data?.jobs.filter(j => j.customerId === editing.customerId).map(j => <option key={j.id} value={j.id}>{j.jobNumber} · {j.title}</option>)}</select></label>
          <label className="space-y-1">Assigned to<select aria-label="Assigned to" className="input w-full" value={editing.assigneeId} onChange={e => patch({ assigneeId: e.target.value })}><option value="">Unassigned</option>{options.data?.assignees.map(a => <option key={a.id} value={a.id}>{name(a)}</option>)}</select></label>
          <label className="space-y-1">Due date<input aria-label="Due date" type="datetime-local" required className="input w-full" value={editing.dueAt} onChange={e => patch({ dueAt: e.target.value })} /></label>
        </div>
        {selected && (selected.doNotCall || selected.doNotEmail || selected.doNotText) && <p className="rounded-lg p-3 bg-amber-50 text-amber-900">Contact preferences: {[selected.doNotCall && 'no calls', selected.doNotEmail && 'no email', selected.doNotText && 'no texts'].filter(Boolean).join(', ')}. Keep this work internal unless contact permission changes.</p>}
        <label className="block space-y-1">Title<input aria-label="Title" required maxLength={200} className="input w-full" value={editing.title} onChange={e => patch({ title: e.target.value })} /></label>
        <label className="block space-y-1">Internal notes<textarea aria-label="Internal notes" maxLength={5000} rows={3} className="input w-full" value={editing.notes} onChange={e => patch({ notes: e.target.value })} /></label>
        <div className="rounded-lg bg-primary-50 p-4 space-y-3">
          <p className="text-sm text-gray-700">Select a customer and add a title, notes, or a linked job. AI uses those facts to fill the requested fields.</p>
          <div className="flex flex-wrap gap-3">{[['message', 'AI draft message'], ['checklist', 'AI suggest checklist'], ['all', 'AI fill all draft fields']].map(([mode, label]) => <button key={mode} type="button" className="btn-secondary flex items-center gap-2" disabled={!editing.customerId || (!editing.title.trim() && !editing.notes.trim() && !editing.jobId)} onClick={() => void draft(mode)}><SparklesIcon className="w-4 h-4" />{busy === mode ? 'Generating…' : label}</button>)}</div>
          {model && <p className="text-xs text-gray-600">Generated with {model}. Fields are editable; saving records a draft.</p>}
        </div>
        <label className="block space-y-1">Customer message draft<textarea aria-label="Customer message draft" rows={5} maxLength={5000} className="input w-full" value={editing.messageDraft} onChange={e => patch({ messageDraft: e.target.value })} /><span className="text-sm text-gray-500">Saved internally. No message is sent from this page.</span></label>
        <div className="space-y-3"><h3 className="font-semibold">Checklist · {editing.checklist.filter(i => i.done).length}/{editing.checklist.length} complete</h3>
          {editing.checklist.map((item, i) => <div className="flex gap-3 items-center" key={i}><input type="checkbox" aria-label={`Complete checklist item ${i + 1}`} checked={item.done} onChange={e => patch({ checklist: editing.checklist.map((value, index) => index === i ? { ...value, done: e.target.checked } : value) })} /><input aria-label={`Checklist item ${i + 1}`} required maxLength={500} className="input flex-1 min-w-0" value={item.text} onChange={e => patch({ checklist: editing.checklist.map((value, index) => index === i ? { ...value, text: e.target.value } : value) })} /><button type="button" className="text-red-700 text-sm" aria-label={`Remove checklist item ${i + 1}`} onClick={() => patch({ checklist: editing.checklist.filter((_, index) => index !== i) })}>Remove</button></div>)}
          <button type="button" className="btn-secondary" disabled={editing.checklist.length >= 20} onClick={() => patch({ checklist: [...editing.checklist, { text: '', done: false }] })}>Add checklist item</button>
        </div>
        <label className="block space-y-1">Status<select aria-label="Status" className="input w-full" value={editing.status} onChange={e => patch({ status: e.target.value })}><option value="OPEN">Open</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></label>
        <p className="text-sm text-gray-500">Complete every checklist item before marking the task completed.</p>
        <button className="btn-primary" type="submit">{busy === 'save' ? 'Saving…' : 'Save follow-up'}</button>
      </fieldset>
    </form> : <>
      <div className="grid grid-cols-3 gap-3">{(['open', 'overdue', 'completed'] as const).map(key => <div className="card" key={key}><p className="text-sm capitalize text-gray-500">{key}</p><p className="text-2xl font-bold">{tasks.data?.counts[key] ?? '—'}</p></div>)}</div>
      <div className="card space-y-4">
        <div className="flex flex-wrap gap-4 items-center"><input aria-label="Search follow-ups" placeholder="Search task titles" className="input flex-1 min-w-0" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} /><select aria-label="Filter status" className="input" value={status} onChange={e => { setStatus(e.target.value); setOverdue(false); setPage(1) }}><option value="">All statuses</option><option value="OPEN">Open</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select><label className="flex items-center gap-2"><input type="checkbox" checked={overdue} onChange={e => { setOverdue(e.target.checked); setStatus(''); setPage(1) }} />Overdue only</label></div>
        {tasks.isLoading && <p role="status">Loading follow-ups…</p>}
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-gray-500">{['Task', 'Customer', 'Assigned to', 'Due', 'Checklist', 'Status', 'Action'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{tasks.data?.data.map(task => <tr key={task.id} className="border-b"><td className="p-3 font-medium">{task.title}{task.job && <Link className="block text-xs text-primary-600" href={`/dashboard/jobs/${task.jobId}`}>{task.job.jobNumber}</Link>}</td><td className="p-3"><Link href={`/dashboard/customers/${task.customerId}`} className="text-primary-600">{name(task.customer)}</Link></td><td className="p-3">{name(task.assignee)}</td><td className={`p-3 ${task.status === 'OPEN' && new Date(task.dueAt).getTime() < Date.now() ? 'text-red-700' : ''}`}>{new Date(task.dueAt).toLocaleString()}</td><td className="p-3">{task.checklist.filter(i => i.done).length}/{task.checklist.length}</td><td className="p-3">{task.status}</td><td className="p-3"><button className="btn-secondary" aria-label={`Edit ${task.title}`} onClick={() => edit(task)}>Edit</button></td></tr>)}</tbody></table></div>
        {tasks.data?.data.length === 0 && <p className="text-gray-500 py-6 text-center">No follow-ups match these filters.</p>}
        <div className="flex items-center justify-between gap-3"><span className="text-sm text-gray-500">{tasks.data?.pagination.total ?? 0} tasks · Page {page} of {tasks.data?.pagination.totalPages ?? 1}</span><div className="flex gap-2"><button className="btn-secondary" disabled={page <= 1 || tasks.isFetching} onClick={() => setPage(p => p - 1)}>Previous</button><button className="btn-secondary" disabled={!tasks.data || page >= tasks.data.pagination.totalPages || tasks.isFetching} onClick={() => setPage(p => p + 1)}>Next</button></div></div>
      </div>
    </>}
  </div>
}
