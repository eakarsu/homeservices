'use client'
import {useState} from 'react'
import {useSession} from 'next-auth/react'
import {saveOfflineDraft} from '@/lib/offline-store'
export default function OfflineJobTools({job,items,work,checklistVersion}:{job:any;items:any[];work:string;checklistVersion:number}){
  const {data:session}=useSession(),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false)
  async function prepare(){setBusy(true);try{
    if(!session?.user.id)throw Error('Sign in before saving an offline draft')
    const id=crypto.randomUUID(),ownerId=session.user.id
    await navigator.serviceWorker.register('/field/sw.js',{scope:'/field/'})
    // Cache the public editor before reporting that offline access is ready.
    const cache=await caches.open('homeservices-field-shell-v1');await cache.add('/field/offline.html')
    await saveOfflineDraft({id,ownerId,jobId:job.id,title:job.title,createdAt:new Date().toISOString(),requestKey:crypto.randomUUID(),payload:{ownerId,updatedAt:job.updatedAt,workPerformed:work,items,checklistVersion,photos:[],photoConsent:false,reviewed:true}})
    sessionStorage.setItem('homeservices-field-owner',ownerId)
    setNotice('Saved on this device. Open the offline notebook now; review and sync when connected.')
  }catch(e){setNotice(e instanceof Error?e.message:'Unable to save offline draft')}finally{setBusy(false)}}
  return <section className="rounded-lg border p-4 space-y-2"><h3 className="font-semibold">Offline field notebook</h3><p className="text-sm">Save a copy on this device to edit notes, checklists and photos without a connection. Local copies remain until you delete or successfully sync them.</p><div className="flex flex-wrap gap-3"><button type="button" className="btn btn-secondary" disabled={busy} onClick={()=>void prepare()}>Save for offline work</button><a className="btn btn-secondary" href="/field/offline.html">Open offline notebook</a></div>{notice&&<p role="status">{notice}</p>}</section>
}
