'use client'
import { useEffect, useState } from 'react'
import { useWorkflowFetch } from '@/hooks/useWorkflowFetch'
export default function BookingForm({companyId}:{companyId:string}) {
  const [info,setInfo]=useState<any>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[receipt,setReceipt]=useState('')
  const send=useWorkflowFetch()
  useEffect(()=>{void fetch(`/api/booking/${companyId}`).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setInfo(d)}).catch(e=>setError(e.message))},[companyId])
  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();const form=Object.fromEntries(new FormData(e.currentTarget));setError('');setBusy(true)
    try {const r=await send(`/api/booking/${companyId}`,{...form,contactAuthorized:form.contactAuthorized==='on'}),d=await r.json();if(!r.ok)throw Error(d.error);setReceipt(d.reference)}catch(e){setError(e instanceof Error?e.message:'Request failed')}finally{setBusy(false)}
  }
  return <main className="max-w-2xl mx-auto p-6 space-y-5"><h1 className="text-3xl font-bold">{info?.company.name || 'Service booking'}</h1>
    {error&&<p role="alert" className="p-3 bg-red-50 text-red-800">{error}</p>}
    {receipt?<section className="card p-6"><h2 className="text-xl font-semibold">Request received</h2><p>The office will review your request and contact you. Your appointment is not confirmed yet.</p><p className="text-sm break-all mt-3">Reference: {receipt}</p></section>:info&&<form onSubmit={submit} className="card p-6 space-y-4"><p>Request a service visit. The office will confirm availability and pricing with you.</p>
      <label className="block">Name<input className="input w-full" name="name" maxLength={150} required autoComplete="name"/></label>
      <div className="grid sm:grid-cols-2 gap-3"><label>Email<input className="input w-full" type="email" name="email" autoComplete="email"/></label><label>Phone with country code<input className="input w-full" type="tel" name="phone" placeholder="+12125551234" autoComplete="tel"/></label></div><p className="text-sm text-gray-600">Provide at least one contact method.</p>
      <label className="block">Service<select name="serviceTypeId" className="select w-full" required><option value="">Choose a service</option>{info.services.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label className="block">Service address<input className="input w-full" name="address" maxLength={500} required autoComplete="street-address"/></label>
      <label className="block">Preferred date and time<input className="input w-full" name="preferredTime" placeholder={`Include date and time (${info.company.timezone})`} maxLength={150}/></label>
      <label className="block">How can we help?<textarea className="input w-full" name="notes" required maxLength={4000} rows={5}/></label>
      <label className="flex gap-2"><input type="checkbox" name="contactAuthorized" required/><span>I authorize the office to contact me about this service request.</span></label>
      <button className="btn btn-primary" disabled={busy}>{busy?'Sending request…':'Request a visit'}</button><p className="text-sm text-gray-600">For emergencies, contact emergency services.</p>
    </form>}
  </main>
}
