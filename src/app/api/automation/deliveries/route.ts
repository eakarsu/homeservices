import crypto from 'node:crypto'
import {NextRequest} from 'next/server'
import {prisma} from '@/lib/prisma'
import {dispatchDelivery} from '@/lib/workflows/communications'
import {officeRoles} from '@/lib/workflows/core'
export async function POST(r:NextRequest){
  const key=process.env.AUTOMATION_SECRET||'',provided=r.headers.get('authorization')||'',expected='Bearer '+key
  if(key.length<32||provided.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(provided),Buffer.from(expected)))return new Response(null,{status:401})
  if(process.env.ENABLE_SCHEDULED_DELIVERY!=='true')return Response.json({error:'Scheduled delivery is disabled'},{status:503})
  const due=await prisma.delivery.findMany({where:{status:'QUEUED',scheduledAt:{lte:new Date()},approvedById:{not:null}},orderBy:{scheduledAt:'asc'},take:20}),results=[]
  for(const row of due){const actor=await prisma.user.findFirst({where:{id:row.approvedById!,companyId:row.companyId,isActive:true}});if(!actor||!officeRoles.includes(actor.role)){results.push({id:row.id,status:'APPROVER_UNAVAILABLE'});continue}try{await dispatchDelivery({id:actor.id,companyId:actor.companyId,role:actor.role},row.id);results.push({id:row.id,status:'PROCESSED'})}catch{results.push({id:row.id,status:'NEEDS_REVIEW'})}}
  return Response.json({results})
}
