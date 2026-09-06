import {NextRequest,NextResponse} from 'next/server'
import {WorkflowError} from '@/lib/workflows/core'
import {processBillingWebhook} from '@/lib/workflows/software-billing'
export async function POST(request:NextRequest){
 try{const reader=request.body?.getReader();if(!reader)return NextResponse.json({error:'Missing webhook body'},{status:400});let length=0;const chunks:Uint8Array[]=[];try{while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>250000){await reader.cancel();return NextResponse.json({error:'Webhook too large'},{status:413})}chunks.push(part.value)}}finally{reader.releaseLock()}
 return NextResponse.json(await processBillingWebhook(Buffer.concat(chunks).toString('utf8'),request.headers.get('stripe-signature')||''))
 }catch(error){if(error instanceof WorkflowError)return NextResponse.json({error:error.message},{status:error.status});return NextResponse.json({error:'Software billing callback could not be processed'},{status:500})}
}
