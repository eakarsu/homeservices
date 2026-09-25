import {NextRequest} from 'next/server'
import {handle,bodyFor,withReceipt} from '@/lib/workflows/core'
import {syncOfflineJob} from '@/lib/workflows/offline'
export const POST=(r:NextRequest,c:{params:Promise<{id:string}>})=>handle(r,async user=>{const body=await bodyFor(r),{id}=await c.params;return withReceipt(user,r.headers.get('Idempotency-Key'),`offline:${id}`,body,()=>syncOfflineJob(user,id,body))})
