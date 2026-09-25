'use client'
import {useState} from 'react'
import {useWorkflowFetch} from '@/hooks/useWorkflowFetch'
export default function VoiceJobReport({jobId,onApply}:{jobId:string;onApply:(value:string)=>void}){
  const [media,setMedia]=useState(''),[consent,setConsent]=useState(false),[report,setReport]=useState<any>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[draft,setDraft]=useState('')
  const mutate=useWorkflowFetch()
  async function generate(){setBusy(true);setError('');try{const r=await mutate('/api/assistant',{mode:'voice-job-report',jobId,media,consent}),d=await r.json();if(!r.ok)throw Error(d.error);setReport(d.report);setDraft(d.report.draft||d.report.summary)}catch(e){setError(e instanceof Error?e.message:'Unable to prepare report')}finally{setBusy(false)}}
  return <section className="border rounded-lg p-4 space-y-3"><h3 className="font-semibold">Voice notes → job report</h3><p className="text-sm">Upload a WAV or MP3 voice note (up to 1 MB). Review the transcript and draft before applying it to work performed.</p>
    <input aria-label="Voice note" type="file" accept="audio/wav,audio/mpeg" disabled={busy} onChange={async e=>{setError('');setMedia('');setReport(null);const file=e.target.files?.[0];if(!file)return;if(file.size>1000000){setError('Voice note must be at most 1 MB');return}try{const value=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file)});setMedia(value)}catch{setError('Unable to read voice note')}}}/>
    <label className="block"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> I am authorized to send this recording and selected job evidence to the AI provider.</label>
    <button type="button" className="btn btn-secondary" disabled={busy||!media||!consent} onClick={()=>void generate()}>{busy?'Preparing draft…':'Draft job report'}</button>{error&&<p role="alert" className="text-red-700">{error}</p>}
    {report&&<div className="space-y-3"><p>{report.summary}</p><textarea aria-label="Editable voice job report" rows={6} className="input w-full" value={draft} onChange={e=>setDraft(e.target.value)}/>{report.uncertainties?.length>0&&<ul className="list-disc pl-5">{report.uncertainties.map((u:string,i:number)=><li key={i}>{u}</li>)}</ul>}<button type="button" className="btn btn-secondary" onClick={()=>onApply(draft)}>Apply reviewed text to work performed</button><p className="text-sm">Applying only updates the form. Save the work record separately.</p></div>}
  </section>
}
