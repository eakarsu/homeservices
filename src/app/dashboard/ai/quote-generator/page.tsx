'use client'
import {useEffect, useRef, useState} from 'react'
import Link from 'next/link'
import {useQuery} from '@tanstack/react-query'
import AIFormAssistant from '@/components/AIFormAssistant'
import AIDraftMarkdown from '@/components/AIDraftMarkdown'
import {combineDraftInstructions} from '@/lib/form-ai'
import {useWorkflowFetch} from '@/hooks/useWorkflowFetch'
import {SparklesIcon, CheckCircleIcon} from '@heroicons/react/24/outline'

type Job = {id:string;jobNumber:string;title:string;tradeType:string;customerId:string;customer:{firstName:string|null;lastName:string|null;companyName:string|null};property:{sqFootage:number|null}|null}
type Price = {id:string;code:string;name:string;description:string|null;unitPrice:string|number;category:string}
type Option = {tier:'good'|'better'|'best';name:string;description:string;laborCost:number;partsCost:number;totalCost:number;warranty:string;estimatedDuration:string;features:string[];recommended?:boolean}
type Quote = {jobDescription:string;options:Option[];notes:string[]}
type Result = {id:string;customerName:string;quote:Quote;provenance:{model:string;generatedAt:string}}
const money=(value:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value)
async function read<T>(url:string):Promise<T> {const response=await fetch(url),data=await response.json();if(!response.ok)throw Error(data.error || 'Unable to load records');return data}
export default function QuoteGeneratorPage() {
  const [jobId,setJobId]=useState(''),[priceIds,setPriceIds]=useState(''),[additionalNotes,setAdditionalNotes]=useState(''),[extraInstructions,setExtraInstructions]=useState('')
  const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<Result|null>(null),[copied,setCopied]=useState('')
  const send=useWorkflowFetch(), resultRef=useRef<HTMLElement>(null), lock=useRef(false)
  const records=useQuery({queryKey:['quote-job-records'],queryFn:()=>read<{jobs:Job[];drafts:Result[]}>('/api/ai/quote-generator')})
  const prices=useQuery({queryKey:['quote-pricebook'],queryFn:()=>read<Price[]>('/api/pricebook')})
  const job=records.data?.jobs.find(j=>j.id===jobId)
  const selectedIds=priceIds.split(',').map(id=>id.trim()).filter(Boolean), selectedPrices=(prices.data||[]).filter(p=>selectedIds.includes(p.id))
  const customerName=job ? [job.customer.firstName,job.customer.lastName].filter(Boolean).join(' ') || job.customer.companyName || '' : ''
  const subtotal=selectedPrices.reduce((sum,p)=>sum+Number(p.unitPrice),0)
  const ready=!!job && selectedPrices.length>0 && selectedPrices.length<=20 && subtotal>0
  useEffect(()=>{if(result)resultRef.current?.scrollIntoView({behavior:'smooth',block:'start'})},[result])
  async function generate() {
    if(lock.current || !ready || !consent)return
    lock.current=true;setBusy(true);setError('');setCopied('')
    try {
      const response=await send('/api/ai/quote-generator',{jobId,pricebookItemIds:selectedIds,additionalNotes:combineDraftInstructions(additionalNotes,extraInstructions)})
      const data=await response.json()
      if(!response.ok)throw Error([data.error,...(Array.isArray(data.blockers)?data.blockers:[])].filter(Boolean).join('. '))
      if(!data.quote || !Array.isArray(data.quote.options))throw Error('The quote response is incomplete. Try again.')
      setResult(data)
      void records.refetch()
    } catch(e) {setError(e instanceof Error?e.message:'Unable to generate quote')} finally {setBusy(false);lock.current=false}
  }
  function changeJob(id:string){setJobId(id);setPriceIds('');setError('')}
  const quoteText=result ? [`Quote for ${result.customerName}`,result.quote.jobDescription,...result.quote.options.map(o=>`${o.tier.toUpperCase()}: ${o.name}\n${o.description}\n${money(o.totalCost)} (Labor ${money(o.laborCost)}; parts ${money(o.partsCost)})\n${o.features.join('\n')}\n${o.warranty}\n${o.estimatedDuration}`),...result.quote.notes].join('\n\n') : ''
  return <main className="max-w-7xl space-y-6">
    <header className="print:hidden"><Link href="/dashboard/ai" className="text-sm text-primary-700">← AI features</Link><h1 className="mt-3 text-2xl font-bold">AI Quote Generator</h1><p className="mt-2 text-slate-600">Generate professional Good/Better/Best quote drafts from your job records and company pricebook.</p></header>
    {(records.error || prices.error || error) && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error || records.error?.message || prices.error?.message}</p>}
    <div className="print:hidden">
      <AIFormAssistant form="ai:quote-generator" values={{jobId,customerId:job?.customerId || '',pricebookItemIds:priceIds,additionalNotes,extraInstructions}} jobId={jobId} customerId={job?.customerId} disabled={busy || records.isPending || prices.isPending || !!records.error || !!prices.error} onApply={patch=>{
        if(typeof patch.jobId==='string')setJobId(patch.jobId)
        if(typeof patch.pricebookItemIds==='string')setPriceIds(patch.pricebookItemIds)
        if(typeof patch.additionalNotes==='string')setAdditionalNotes(patch.additionalNotes)
        if(typeof patch.extraInstructions==='string')setExtraInstructions(patch.extraInstructions)
        setError('')
      }}/>
    </div>
    <form className="grid gap-6 lg:grid-cols-2 print:hidden" onSubmit={e=>{e.preventDefault();void generate()}}>
      <section className="card space-y-4"><h2 className="text-lg font-semibold">Job and customer details</h2>
        <label className="block">Authorized job<select className="input mt-1" value={jobId} disabled={busy || records.isPending} onChange={e=>changeJob(e.target.value)}><option value="">Select a job...</option>{records.data?.jobs.map(j=><option key={j.id} value={j.id}>{j.jobNumber} · {j.title}</option>)}</select></label>
        {records.data && !records.data.jobs.length && <p role="status" className="text-sm text-amber-800">Create a job before preparing a quote. <Link className="underline" href="/dashboard/jobs/new">Create job</Link></p>}
        <label className="block">Service Type<input className="input mt-1 bg-slate-50" value={job?.tradeType || ''} placeholder="Filled from the selected job" readOnly/></label>
        <label className="block">Customer Name<input className="input mt-1 bg-slate-50" value={customerName} placeholder="Filled from the selected job" readOnly/></label>
        <label className="block">Property Size (sq ft)<input className="input mt-1 bg-slate-50" value={job?.property?.sqFootage ?? ''} placeholder={job?'Not recorded for this property':'Filled from the selected job'} readOnly/></label>
        <p className="text-xs text-slate-500">Customer, trade and property details come from the job record. Complete form starts with your most recent available job when no job or instructions are supplied.</p>
        {job && !job.property?.sqFootage && <p className="text-sm text-amber-800">Property size is not recorded. Add it to the customer’s property record if it is needed for this quote.</p>}
      </section>
      <section className="card space-y-4"><h2 className="text-lg font-semibold">Service and pricing</h2>
        <fieldset disabled={busy}><legend className="mb-2 text-sm font-medium">Service — select up to 20 pricebook items</legend><div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">{prices.data?.map(p=><label key={p.id} className="flex items-start gap-3 rounded p-2 hover:bg-slate-50"><input type="checkbox" className="mt-1" checked={selectedIds.includes(p.id)} disabled={!selectedIds.includes(p.id) && selectedIds.length>=20} onChange={e=>setPriceIds((e.target.checked?[...selectedIds,p.id]:selectedIds.filter(id=>id!==p.id)).join(','))}/><span className="min-w-0 flex-1 text-sm">{p.name}<span className="block text-xs text-slate-500">{p.code} · {p.category}</span></span><span className="text-sm font-medium">{money(Number(p.unitPrice))}</span></label>)}{prices.data?.length===0 && <p role="status" className="text-sm text-amber-800">Add an active pricebook item before generating a quote. <Link href="/dashboard/settings/pricebook" className="underline">Open pricebook</Link></p>}</div></fieldset>
        <p className="text-sm font-medium">Selected pricebook subtotal: {money(subtotal)}</p>
        <label className="block">Additional Notes<textarea className="input mt-1" rows={5} maxLength={12000} disabled={busy} value={additionalNotes} onChange={e=>setAdditionalNotes(e.target.value)} placeholder="Requirements, existing equipment and customer preferences..."/></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/>I am authorized to send the selected job, pricebook and notes to the configured AI provider.</label>
        <button type="submit" disabled={busy || !ready || !consent} className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50"><SparklesIcon className="h-5 w-5"/>{busy?'Generating quote…':'Generate Quote'}</button>
        {!ready && <p className="text-xs text-slate-500">Choose a job and at least one priced service, or use Complete form to suggest them.</p>}
      </section>
    </form>
    {!!records.data?.drafts.length && <details className="card print:hidden"><summary className="cursor-pointer font-semibold">Saved quote drafts ({records.data.drafts.length})</summary><div className="mt-3 space-y-2">{records.data.drafts.map(draft=><button key={draft.id} type="button" className="block text-left text-sm text-indigo-700 hover:underline" onClick={()=>{setResult(draft);setCopied('')}}>View quote for {draft.customerName} · {new Date(draft.provenance.generatedAt).toLocaleString()}</button>)}</div></details>}
    {result && <section ref={resultRef} aria-label="Generated quote" className="scroll-mt-24 space-y-6">
      <header className="rounded-2xl bg-slate-900 p-6 text-white"><span className="text-xs uppercase tracking-widest text-indigo-200">AI quote · Review required</span><h2 className="mt-2 text-2xl font-bold">Quote for {result.customerName}</h2><p className="mt-2 text-slate-200">{result.quote.jobDescription}</p></header>
      <div className="grid gap-5 xl:grid-cols-3">{result.quote.options.map(option=><article key={option.tier} className={`rounded-2xl border bg-white p-5 ${option.recommended?'border-indigo-400 ring-1 ring-indigo-200':'border-slate-200'}`}><div className="flex justify-between gap-2"><span className="text-xs font-bold uppercase tracking-widest text-indigo-700">{option.tier}</span>{option.recommended && <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">Recommended</span>}</div><h3 className="mt-4 text-xl font-bold">{option.name}</h3><div className="mt-3"><AIDraftMarkdown text={option.description}/></div><p className="mt-5 text-3xl font-bold">{money(option.totalCost)}</p><p className="mt-2 text-xs text-slate-500">Labor {money(option.laborCost)} · Parts {money(option.partsCost)}</p><ul className="my-5 space-y-3">{option.features.map((feature,i)=><li key={i} className="flex gap-2 text-sm"><CheckCircleIcon className="h-5 w-5 shrink-0 text-indigo-600"/>{feature}</li>)}</ul><dl className="space-y-2 border-t pt-4 text-sm"><div><dt className="font-semibold">Estimated duration</dt><dd>{option.estimatedDuration || 'Confirm before scheduling'}</dd></div><div><dt className="font-semibold">Warranty</dt><dd>{option.warranty || 'Confirm applicable terms'}</dd></div></dl></article>)}</div>
      {!!result.quote.notes?.length && <section className="card"><h3 className="mb-3 font-semibold">Details to review</h3><ul className="list-disc space-y-2 pl-5">{result.quote.notes.map((note,i)=><li key={i}><AIDraftMarkdown text={note}/></li>)}</ul></section>}
      <div className="flex flex-wrap gap-3 print:hidden"><button type="button" className="btn-secondary" onClick={async()=>{try{await navigator.clipboard.writeText(quoteText);setCopied('Quote copied')}catch{setCopied('Unable to copy. Select the quote text to copy it.')}}}>Copy quote</button><button type="button" className="btn-secondary" onClick={()=>window.print()}>Print / Save PDF</button></div>{copied && <p role="status">{copied}</p>}
      <p className="text-xs text-slate-500">Draft generated {new Date(result.provenance.generatedAt).toLocaleString()} · Review scope, pricing and terms before creating or sending an estimate.</p>
    </section>}
  </main>
}
