'use client'
import React, {useState} from 'react'
import {CheckIcon, ClipboardDocumentIcon, PencilSquareIcon, SparklesIcon, XMarkIcon} from '@heroicons/react/24/outline'
import AIDraftMarkdown from './AIDraftMarkdown'

type Evidence = {id:string;label?:string;type?:string;facts?:unknown}
type Draft = {
  id:string;feature?:string;createdAt?:string;model?:string;providerReceipt?:string;
  success?:boolean;reviewedAt?:string;reviewedText?:string;expectedHash?:string;
  output?:{summary?:string;draft?:string;recommendations?:{text:string;sourceIds:string[]}[];uncertainties?:string[]};
  input?:{evidence?:Evidence[]}
}
const label = (value:string) => value.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ').replace(/^./,s=>s.toUpperCase())
function sourceName(source:Evidence) {
  if (source.label && source.label !== source.id) return source.label
  const facts=source.facts && typeof source.facts==='object' ? source.facts as Record<string,unknown> : {}
  const name=[facts.firstName,facts.lastName].filter(value=>typeof value==='string').join(' ')
  return name || (typeof facts.companyName==='string' && facts.companyName) || (source.type ? label(source.type) : 'Source record')
}
function SourceFacts({value}: {value:unknown}) {
  if (value === null || value === undefined || value === '') return <span className="text-slate-400">Not recorded</span>
  if (Array.isArray(value)) return value.length ? <ul className="space-y-2">{value.map((item,i)=><li key={i} className="border-l border-slate-200 pl-3"><SourceFacts value={item}/></li>)}</ul> : <span className="text-slate-400">None recorded</span>
  if (typeof value === 'object') return <dl className="space-y-2">{Object.entries(value).map(([key,item])=><div key={key} className="grid gap-1 sm:grid-cols-[150px_1fr]"><dt className="font-medium text-slate-500">{label(key)}</dt><dd className="min-w-0 break-words"><SourceFacts value={item}/></dd></div>)}</dl>
  return <span>{typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value)}</span>
}

export default function AIDraftReport({draft,title,review,onReviewChange,onRecordReview,onClose,busy}: {
  draft:Draft;title:string;review:string;onReviewChange:(value:string)=>void;
  onRecordReview:()=>void;onClose:()=>void;busy:boolean
}) {
  const [editMode,setEditing]=useState(false), [copyStatus,setCopyStatus]=useState('')
  const editing=editMode && !draft.reviewedAt
  const output=draft.output||{}, sources=draft.input?.evidence||[]
  const text=draft.reviewedAt ? draft.reviewedText || output.draft || '' : review
  return <section aria-label="Generated AI draft" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-white p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-700"><SparklesIcon className="h-4 w-4"/>AI draft</p><h2 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
          {draft.createdAt && <p className="mt-2 text-xs text-slate-500">{new Date(draft.createdAt).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}</p>}
        </div>
        <button type="button" onClick={onClose} aria-label="Close draft" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><XMarkIcon className="h-5 w-5"/></button>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${draft.reviewedAt ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{draft.reviewedAt ? 'Review recorded' : 'Ready for your review'}</span>
        <span className="text-xs text-slate-500">{sources.length} source {sources.length===1?'record':'records'}</span>
        <button type="button" className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={async()=>{try{await navigator.clipboard.writeText(text || output.summary || '');setCopyStatus('Draft copied')}catch{setCopyStatus('Could not copy. Open the editor to select the text.')}}}><ClipboardDocumentIcon className="h-4 w-4"/>Copy draft</button>
        {!draft.reviewedAt && <button type="button" onClick={()=>setEditing(!editing)} className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"><PencilSquareIcon className="h-4 w-4"/>{editing?'Preview draft':'Edit draft'}</button>}
      </div>
      {copyStatus && <p role="status" className="mt-3 text-xs text-slate-600">{copyStatus}</p>}
    </header>
    <div className="space-y-7 p-5 sm:p-7">
      {output.summary && <section className="rounded-xl bg-slate-50 p-5"><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Overview</h3><AIDraftMarkdown text={output.summary}/></section>}
      <section>
        <h3 className="mb-4 text-base font-semibold text-slate-900">{draft.reviewedAt?'Reviewed draft':editing?'Edit your draft':'Draft'}</h3>
        {editing ? <><label htmlFor={`review-${draft.id}`} className="sr-only">Edited draft after review</label><textarea id={`review-${draft.id}`} className="input min-h-[320px] w-full font-mono text-sm leading-7" value={review} onChange={e=>onReviewChange(e.target.value)}/><p className="mt-2 text-xs text-slate-500">Headings, lists and tables are supported. Preview your changes before recording your review.</p></> : text ? <AIDraftMarkdown text={text}/> : <p className="text-sm text-slate-500">The draft is empty. Open the editor to add text before recording your review.</p>}
      </section>
      {!!output.recommendations?.length && <section className="border-t border-slate-100 pt-6"><h3 className="mb-4 text-base font-semibold text-slate-900">Recommended next steps</h3><ol className="space-y-3">{output.recommendations.map((item,i)=><li key={i} className="flex gap-3 rounded-xl border border-slate-200 p-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">{i+1}</span><div className="min-w-0 flex-1"><AIDraftMarkdown text={item.text}/><div className="mt-3 flex flex-wrap gap-2">{item.sourceIds.length ? item.sourceIds.map(id=><span key={id} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{sources.find(s=>s.id===id) ? sourceName(sources.find(s=>s.id===id)!) : 'Source record'}</span>) : <span className="text-xs text-slate-500">Based on supplied notes or media</span>}</div></div></li>)}</ol></section>}
      {!!output.uncertainties?.length && <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-5"><h3 className="mb-3 text-sm font-semibold text-amber-950">Details to confirm</h3><ul className="list-disc space-y-3 pl-5 marker:text-amber-500">{output.uncertainties.map((item,i)=><li key={i}><AIDraftMarkdown text={item}/></li>)}</ul></section>}
      {!!sources.length && <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-700">Source records ({sources.length})</summary><div className="mt-4 space-y-3">{sources.map(source=><details key={source.id} className="rounded-lg bg-slate-50 p-4"><summary className="cursor-pointer text-sm font-medium text-slate-900">{sourceName(source)} <span className="ml-2 text-xs font-normal text-slate-500">{source.type && label(source.type)}</span></summary><div className="mt-4 text-xs leading-6 text-slate-700"><SourceFacts value={source.facts}/></div></details>)}</div></details>}
      <details className="text-xs text-slate-500"><summary className="cursor-pointer">Generation details</summary><dl className="mt-3 space-y-2"><div><dt className="inline font-medium">Model: </dt><dd className="inline">{draft.model || 'Not recorded'}</dd></div><div className="break-all"><dt className="inline font-medium">Provider receipt: </dt><dd className="inline">{draft.providerReceipt || 'Not recorded'}</dd></div></dl></details>
    </div>
    {draft.success && !draft.reviewedAt && <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7"><p className="max-w-lg text-xs leading-5 text-slate-500">Review the draft and confirm the details before recording your review. This does not assign work or contact the customer.</p><button type="button" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50" disabled={busy || !review.trim() || !draft.expectedHash} onClick={onRecordReview}><CheckIcon className="h-4 w-4"/>{busy?'Saving review…':'Record review'}</button></footer>}
  </section>
}
