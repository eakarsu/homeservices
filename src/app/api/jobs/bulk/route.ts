import {NextRequest,NextResponse} from 'next/server'
import {handle,bodyFor,fail,office,txFor} from '@/lib/workflows/core'
import {updateJob} from '@/lib/workflows/execution'
export const DELETE=(request:NextRequest)=>handle(request,async user=>{office(user);return NextResponse.json({error:'Jobs are retained; cancel them instead'},{status:405})})
export const PATCH=(request:NextRequest)=>handle(request,async user=>{office(user);const body=await bodyFor(request);if(!Array.isArray(body.ids)||!body.ids.length||body.ids.length>100||body.ids.some(id=>typeof id!=='string'))fail('Select 1–100 jobs');if(!['CANCELLED','ON_HOLD'].includes(String(body.status)))fail('Open each job to review and apply this transition',409);return txFor(user,async()=>{for(const id of body.ids as string[])await updateJob(user,id,{status:body.status,reason:body.reason});return {updated:(body.ids as string[]).length}})})
