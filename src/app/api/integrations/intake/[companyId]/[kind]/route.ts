import { NextRequest } from 'next/server'
import twilio from 'twilio'
import { configuredProvider } from '@/lib/workflows/providers'
import { receiveIntake } from '@/lib/workflows/intake'
import { prisma } from '@/lib/prisma'
export async function POST(r: NextRequest, context: {params: Promise<{companyId:string;kind:string}>}) {
  try {
    const {companyId,kind} = await context.params
    if (!['sms','voice','voice-result'].includes(kind)) return new Response(null,{status:404})
    const reader = r.body?.getReader(), chunks: Uint8Array[] = []; let size=0
    if (reader) while(true) { const {done,value}=await reader.read(); if(done)break; size+=value.length; if(size>50000){await reader.cancel();return new Response(null,{status:413})} chunks.push(value) }
    const values = Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString('utf8'))), c = await configuredProvider(companyId,'twilio')
    const url = new URL(`/api/integrations/intake/${companyId}/${kind}`,process.env.NEXTAUTH_URL).toString()
    if (!twilio.validateRequest(String(c.credentials.token),r.headers.get('x-twilio-signature') || '',url,values) || values.AccountSid !== c.config.accountSid || values.To !== c.config.from) return new Response(null,{status:403})
    if (kind === 'sms') {
      if (!/^SM[a-f\d]{32}$/i.test(values.MessageSid || '')) return new Response(null,{status:400})
      const optout = (values.OptOutType || values.Body || '').trim().toUpperCase()
      if (['STOP','STOPALL','UNSUBSCRIBE','CANCEL','END','QUIT','REVOKE','OPTOUT'].includes(optout)) {
        await prisma.customer.updateMany({where:{companyId,OR:[{phone:values.From},{mobile:values.From}]},data:{doNotText:true}})
      } else if (optout !== 'START' && optout !== 'HELP') {
        await receiveIntake(companyId,'SMS',values.MessageSid,{phone:values.From,notes:values.Body,contactAuthorized:true})
      }
      return new Response('<Response/>',{headers:{'Content-Type':'text/xml'}})
    }
    if (!/^CA[a-f\d]{32}$/i.test(values.CallSid || '')) return new Response(null,{status:400})
    const response = new twilio.twiml.VoiceResponse()
    const handoff = () => { if(c.config.handoffNumber) response.dial({timeout:25},String(c.config.handoffNumber)); else response.say('The office is unavailable. Please leave a service request or call again later.'); response.hangup() }
    if (values.Digits === '0' || c.config.voiceConsent !== 'enabled') handoff()
    else if (kind === 'voice-result') {
      if (values.SpeechResult) {
        await receiveIntake(companyId,'VOICE',values.CallSid,{phone:values.From,notes:values.SpeechResult,contactAuthorized:true})
        response.say('Your request has been recorded for office review. An appointment is not yet confirmed.')
      } else response.say('We did not receive a service request.')
      handoff()
    } else {
      const gather=response.gather({input:['speech','dtmf'],numDigits:1,action:new URL(`/api/integrations/intake/${companyId}/voice-result`,process.env.NEXTAUTH_URL).toString(),method:'POST',speechTimeout:'auto',timeout:6,actionOnEmptyResult:true})
      gather.say('Welcome. This automated service transcribes your request for our office and AI drafting assistant. To speak with a person without transcription, press zero. Otherwise, after this message, tell us your name, service address, problem, and preferred appointment time. For an emergency, contact emergency services.')
    }
    return new Response(response.toString(),{headers:{'Content-Type':'text/xml'}})
  } catch { return new Response('Unable to process intake',{status:503}) }
}
