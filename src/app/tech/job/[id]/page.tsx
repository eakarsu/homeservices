"use client"
import {useParams} from 'next/navigation'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import JobWorkPanel from '@/components/JobWorkPanel'
import {useWorkflowFetch} from '@/hooks/useWorkflowFetch'
export default function Page(){const id=String(useParams().id),[job,setJob]=useState<{id:string;title:string;status:string;updatedAt:string;description:string}|null>(null),[error,setError]=useState(''),mutate=useWorkflowFetch();useEffect(()=>{fetch(`/api/jobs/${id}`).then(async r=>{const j=await r.json();if(!r.ok)throw Error(j.error);setJob(j)}).catch(e=>setError(e.message))},[id]);async function status(next:string){const r=await mutate(`/api/jobs/${id}`,{status:next,updatedAt:job?.updatedAt},'PUT'),j=await r.json();if(!r.ok)setError(j.error);else setJob(j)}return <div className="space-y-4"><Link href="/tech">← My jobs</Link><h1 className="text-xl font-bold">{job?.title||'Job'}</h1>{error&&<p role="alert">{error}</p>}<p>{job?.description}</p>{job&&['SCHEDULED','DISPATCHED','ON_HOLD','EN_ROUTE'].includes(job.status)&&<div className="flex gap-2">{job.status!=='EN_ROUTE'&&<button className="btn btn-secondary" onClick={()=>void status('EN_ROUTE')}>En route</button>}<button className="btn btn-primary" onClick={()=>void status('IN_PROGRESS')}>Start work</button></div>}<JobWorkPanel key={job?.updatedAt} jobId={id}/></div>}
