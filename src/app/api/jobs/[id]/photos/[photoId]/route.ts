import {NextRequest} from 'next/server'
import {prisma} from '@/lib/prisma'
import {handle,jobFor,fail} from '@/lib/workflows/core'
export const GET=(request:NextRequest,context:{params:Promise<{id:string;photoId:string}>})=>handle(request,async user=>{const {id,photoId}=await context.params;await jobFor(prisma,user,id);const photo=await prisma.jobPhoto.findFirst({where:{id:photoId,jobId:id}});if(!photo?.bytes)fail('Photo file is unavailable',404);return new Response(new Uint8Array(photo!.bytes!),{headers:{'Content-Type':photo!.mediaType||'application/octet-stream','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline'}})})
