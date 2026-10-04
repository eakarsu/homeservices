'use client'
import {useState} from 'react'
import {useSession} from 'next-auth/react'
import {OFFLINE_OWNER_KEY, saveOfflineDraft} from '@/lib/offline-store'

type AssignedJob = {
  id: string; jobNumber?: string; title?: string; description?: string | null; updatedAt?: string;
  status?: string; tradeType?: string; scheduledStart?: string | null;
  property?: { address?: string; city?: string; state?: string; zip?: string } | null;
  assignments?: Array<{ technicianId: string }>;
}

export default function OfflineJobTools({job,items,work,checklistVersion}:{job:AssignedJob;items:Record<string,unknown>[];work:string;checklistVersion:number}){
  const {data:session}=useSession(),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false)
  async function prepare(){
    setBusy(true)
    try{
      const actor=session?.user
      if(actor?.role!=='TECHNICIAN'||!actor.id||!actor.companyId||!actor.technicianId)throw Error('Sign in as the assigned technician before caching this job')
      const response=await fetch(`/api/jobs/${encodeURIComponent(job.id)}`,{cache:'no-store'})
      const current=await response.json()
      if(!response.ok)throw Error(current.error||'Assigned job unavailable')
      if(!current.assignments?.some((row:{technicianId:string})=>row.technicianId===actor.technicianId))throw Error('This job is no longer assigned to you')
      if(current.updatedAt!==job.updatedAt)throw Error('Job changed. Reload before saving an offline copy')
      if(['COMPLETED','INVOICED','CANCELLED'].includes(current.status))throw Error('Closed jobs cannot be cached for new field work')
      const evidenceResponse=await fetch(`/api/jobs/${encodeURIComponent(job.id)}/execution`,{cache:'no-store'})
      const evidence=await evidenceResponse.json()
      if(!evidenceResponse.ok)throw Error(evidence.error||'Job checklist unavailable')
      if(evidence.checklist&&evidence.checklist.version!==checklistVersion)throw Error('Checklist changed. Reload before caching this job')
      if(!('serviceWorker' in navigator)||!('caches' in window)||!('indexedDB' in window))throw Error('This browser cannot store the offline notebook')
      const registration=await navigator.serviceWorker.register('/field/sw.js',{scope:'/field/'})
      await registration.update()
      const pendingWorker=registration.installing||registration.waiting
      if(pendingWorker&&pendingWorker.state!=='activated')await new Promise<void>((resolve,reject)=>{
        const timer=window.setTimeout(()=>reject(Error('Offline notebook could not become ready. Try again online.')),10000)
        const onState=()=>{
          if(pendingWorker.state==='activated'){window.clearTimeout(timer);resolve()}
          if(pendingWorker.state==='redundant'){window.clearTimeout(timer);reject(Error('Offline notebook installation was replaced. Try again.'))}
        }
        pendingWorker.addEventListener('statechange',onState)
        onState()
      })
      const cache=await caches.open('homeservices-field-shell-v2')
      await cache.addAll(['/field/offline.html','/field/offline.js'])
      const ownerId=actor.id,companyId=actor.companyId,technicianId=actor.technicianId
      const address=[current.property?.address,current.property?.city,current.property?.state,current.property?.zip].filter(Boolean).join(', ')
      await saveOfflineDraft({
        id:`${companyId}:${ownerId}:${job.id}`,ownerId,companyId,technicianId,jobId:job.id,title:current.title,
        createdAt:new Date().toISOString(),requestKey:crypto.randomUUID(),state:'pending',
        essentials:{jobNumber:current.jobNumber,title:current.title,tradeType:current.tradeType,status:current.status,scheduledStart:current.scheduledStart||null,address,scope:current.description||''},
        payload:{ownerId,companyId,technicianId,updatedAt:current.updatedAt,workPerformed:work,items,checklistVersion,photos:[],photoConsent:false,reviewed:false},
      })
      localStorage.setItem(OFFLINE_OWNER_KEY,`${companyId}:${ownerId}`)
      setNotice('Assigned job saved on this device. Open the notebook to review queued work and sync when connected.')
    }catch(e){setNotice(e instanceof Error?e.message:'Unable to save offline draft')}
    finally{setBusy(false)}
  }
  return <section className="rounded-lg border p-4 space-y-2"><h3 className="font-semibold">Offline field notebook</h3><p className="text-sm">Cache this assigned job's scope, address and checklist; queue work notes and photos on this device. Review before syncing. No payment or message is sent offline.</p><p className="text-sm">Device copies are not encrypted by this app. Use a private device and delete local drafts after use.</p><div className="flex flex-wrap gap-3"><button type="button" className="btn btn-secondary" disabled={busy} onClick={()=>void prepare()}>Save assigned job for offline work</button><a className="btn btn-secondary" href="/field/offline.html">Open offline notebook</a></div>{notice&&<p role="status">{notice}</p>}</section>
}
