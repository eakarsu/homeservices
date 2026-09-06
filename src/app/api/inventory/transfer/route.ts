import {NextRequest} from 'next/server'
import {handle,bodyFor,withReceipt} from '@/lib/workflows/core'
import {inventory} from '@/lib/workflows/stock'
export const POST=(request:NextRequest)=>handle(request,async user=>{const body=await bodyFor(request);return withReceipt(user,request.headers.get('Idempotency-Key'),'stock.transfer',body,()=>inventory(user,body,'transfer'))})
