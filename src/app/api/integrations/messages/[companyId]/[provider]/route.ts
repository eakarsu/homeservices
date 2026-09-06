import {NextRequest} from 'next/server'
import twilio from 'twilio'
import {Resend} from 'resend'
import {configuredProvider} from '@/lib/workflows/providers'
import {recordDeliveryEvidence,deliveryStatus} from '@/lib/workflows/communications'
import {digest} from '@/lib/workflows/assistant-requests'
export const POST=async(request:NextRequest,context:{params:Promise<{companyId:string;provider:string}>})=>{
 try{const {companyId,provider}=await context.params;if(!['twilio','resend'].includes(provider))return new Response(null,{status:404});const c=await configuredProvider(companyId,provider),reader=request.body?.getReader(),chunks:Uint8Array[]=[];let size=0;if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>100000){await reader.cancel();return new Response(null,{status:413})}chunks.push(value)}const raw=Buffer.concat(chunks).toString('utf8');let status:string|null=null,id='',reference=''
 if(provider==='twilio'){const values=Object.fromEntries(new URLSearchParams(raw)),url=new URL(`/api/integrations/messages/${companyId}/twilio`,process.env.NEXTAUTH_URL).toString();if(!twilio.validateRequest(String(c.credentials.token),request.headers.get('x-twilio-signature')||'',url,values)||values.AccountSid!==c.config.accountSid||!values.MessageSid)return new Response(null,{status:403});status=deliveryStatus(values.MessageStatus);reference=values.MessageSid;id=digest([reference,values.MessageStatus])}
 else{if(!c.credentials.webhookSecret)return new Response(null,{status:503});const e=new Resend(String(c.credentials.token)).webhooks.verify({payload:raw,headers:{id:request.headers.get('svix-id')||'',timestamp:request.headers.get('svix-timestamp')||'',signature:request.headers.get('svix-signature')||''},webhookSecret:String(c.credentials.webhookSecret)});status=deliveryStatus(e.type);reference='email_id' in e.data?String(e.data.email_id):'';id=request.headers.get('svix-id')!}
 if(status&&reference)await recordDeliveryEvidence(companyId,provider,id,reference,status);return Response.json({received:true})
 }catch{return Response.json({error:'Callback verification or processing failed'},{status:400})}
}
