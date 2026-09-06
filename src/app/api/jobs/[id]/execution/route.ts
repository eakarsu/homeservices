import {NextRequest} from 'next/server'
import {handle,bodyFor,withReceipt,text} from '@/lib/workflows/core'
import {execution} from '@/lib/workflows/execution'
type Context={params:Promise<{id:string}>}
export const GET=(r:NextRequest,c:Context)=>handle(r,async user=>execution(user,(await c.params).id))
export const POST=(r:NextRequest,c:Context)=>handle(r,async user=>{const id=(await c.params).id,body=await bodyFor(r);return withReceipt(user,r.headers.get('Idempotency-Key'),'job.execution',{id,...body},()=>execution(user,id,body,text(body.action,'action',30)))})
