'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { SparklesIcon, ArrowPathIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import { formAIActions, getFormFields, pickFormValues, unchangedPatch, type FormValues } from '@/lib/form-ai'
import { useWorkflowFetch } from '@/hooks/useWorkflowFetch'

type Props = { form: string; values: object; onApply: (patch: FormValues) => void; jobId?: string; customerId?: string; disabled?: boolean }
export default function AIFormAssistant({ form, values, onApply, jobId, customerId, disabled }: Props) {
  const fields = getFormFields(form), id = useId(), send = useWorkflowFetch()
  const [source, setSource] = useState(''), [busy, setBusy] = useState(''), [error, setError] = useState('')
  const [result, setResult] = useState<{ summary: string; missing: string[]; count: number; model: string } | null>(null)
  const [undo, setUndo] = useState<{ before: FormValues; after: FormValues } | null>(null)
  const lock = useRef(false), alive = useRef(true), current = useRef({ values, onApply, jobId, customerId })
  current.current = { values, onApply, jobId, customerId }
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  if (!fields.length) return null
  const currentValues = pickFormValues(form, values)
  const sourceValue = form === 'workspace' ? String(currentValues.extraInstructions || '') : source
  const completed = fields.filter(f => String(currentValues[f.key] ?? '').trim()).length
  async function generate(action: string) {
    if (lock.current || disabled) return
    lock.current = true; setBusy(action); setError(''); setResult(null)
    const snapshot = pickFormValues(form, current.current.values), selection = { jobId, customerId }
    try {
      const response = await send('/api/assistant', { mode: 'form-autofill', form, fieldAction: action, values: snapshot, notes: sourceValue, jobId, customerId, consent: true })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to prepare suggestions. Please try again.')
      if (!alive.current) return
      if (selection.jobId !== current.current.jobId || selection.customerId !== current.current.customerId) {
        throw new Error('The selected record changed. Generate again for the current record.')
      }
      const report = data.report
      if (!report?.fields || typeof report.summary !== 'string' || !Array.isArray(report.uncertainties)) throw new Error('The AI response could not be applied. Please try again.')
      const patch = unchangedPatch(pickFormValues(form, current.current.values), snapshot, pickFormValues(form, report.fields))
      const before = Object.fromEntries(Object.keys(patch).map(key => [key, snapshot[key] ?? '']))
      current.current.onApply(patch)
      setUndo(Object.keys(patch).length ? { before, after: patch } : null)
      setResult({ summary: report.summary, missing: report.uncertainties, count: Object.keys(patch).length, model: data.model })
    } catch (e) { if (alive.current) setError(e instanceof Error ? e.message : 'Unable to generate suggestions.') }
    finally { lock.current = false; if (alive.current) setBusy('') }
  }
  const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-wait'
  return <section aria-label="AI form assistant" className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-indigo-950 px-5 py-4 text-white">
      <div className="flex items-center gap-3"><span className="rounded-xl bg-white/10 p-2.5"><SparklesIcon className="h-5 w-5 text-indigo-200" /></span><div><h2 className="text-base font-semibold">Your AI drafting assistant</h2><p className="mt-0.5 text-xs text-indigo-100">From rough notes to a complete, editable draft</p></div></div>
      <span role="status" className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium">{busy ? "AI is writing…" : `${completed} / ${fields.length} fields filled`}</span>
    </div>
    <div className="space-y-4 p-5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">Extra instructions (optional)<span className="ml-2 text-xs font-normal text-slate-500">Use existing form details or add context</span></label>
      <textarea id={id} rows={3} maxLength={12000} value={sourceValue} onChange={e => form === 'workspace' ? onApply({ extraInstructions: e.target.value }) : setSource(e.target.value)} disabled={!!busy || disabled} placeholder="Click an AI button to draft from the current form. Add notes here only if you want more specific suggestions." className="input w-full resize-y rounded-xl border-slate-200 text-sm" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-label="AI drafting actions">
        {formAIActions.map((action, index) => <button key={action.key} type="button" className={`${buttonClass} ${index === 0 ? 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700' : 'border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100'}`} disabled={!!busy || disabled} onClick={() => void generate(action.key)}>
          {busy === action.key ? <ArrowPathIcon className="h-4 w-4 shrink-0 animate-spin" /> : <SparklesIcon className="h-4 w-4 shrink-0" />}
          {busy === action.key ? action.pending : action.label}
        </button>)}
      </div>
      <p className="text-xs leading-5 text-slate-500">Every button generates and fills matching fields, including optional fields. Uses existing form details and selected records. Empty forms receive editable draft text; unknown contact details, dates and prices stay blank. Review before saving.</p>
      {busy && <p role="status" className="flex items-center gap-2 text-sm text-indigo-700"><ArrowPathIcon className="h-4 w-4 animate-spin" />Preparing suggestions from your details…</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {result && <div className="space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-sm font-semibold text-emerald-900">{result.count ? `${result.count} ${result.count === 1 ? "field" : "fields"} filled · Ready for your review` : 'No fields changed · More detail may be needed'}</p>{undo && <button type="button" disabled={!!busy} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 underline" onClick={() => { const patch = unchangedPatch(pickFormValues(form, current.current.values), undo.after, undo.before); current.current.onApply(patch); setUndo(null); setResult(null) }}><ArrowUturnLeftIcon className="h-3.5 w-3.5" />Undo AI changes</button>}</div><p className="text-sm text-slate-700">{result.summary}</p>{result.missing.length > 0 && <details className="text-sm text-slate-600"><summary className="cursor-pointer font-medium">Details to confirm ({result.missing.length})</summary><ul className="mt-2 list-disc space-y-1 pl-5">{result.missing.map((item, i) => <li key={i}>{item}</li>)}</ul></details>}<p className="text-xs text-slate-500">AI draft · {result.model} · Edits made while generating are preserved</p></div>}
    </div>
  </section>
}
