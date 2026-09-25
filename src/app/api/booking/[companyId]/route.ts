import { NextRequest } from 'next/server'
import { bodyFor, WorkflowError, text, fail } from '@/lib/workflows/core'
import { publicBookingInfo, receiveIntake } from '@/lib/workflows/intake'
import { validFollowUpOrigin } from '@/lib/follow-ups'
type Context = { params: Promise<{companyId: string}> }
async function respond(work: () => Promise<unknown>) {
  try { return Response.json(await work(), { headers: { 'Cache-Control':'no-store' } }) }
  catch(e) { return Response.json({error:e instanceof WorkflowError ? e.message : 'Unable to process booking request'}, {status:e instanceof WorkflowError ? e.status : 500}) }
}
export const GET = (_r: NextRequest,c: Context) => respond(async () => publicBookingInfo((await c.params).companyId))
export const POST = (r: NextRequest,c: Context) => respond(async () => {
  if (!validFollowUpOrigin(r.headers.get('origin'),process.env.NEXTAUTH_URL || r.url,process.env.NODE_ENV !== 'production')) fail('Invalid origin',403)
  const body = await bodyFor(r), reference = text(r.headers.get('Idempotency-Key'),'request reference',100)
  if (!/^[\w-]{16,100}$/.test(reference)) fail('Invalid request reference')
  return receiveIntake((await c.params).companyId,'WEB',reference,body)
})
