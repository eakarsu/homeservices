import {NextRequest} from 'next/server'
import {handle,bodyFor} from '@/lib/workflows/core'
import {assign} from '@/lib/workflows/scheduling'
export const POST=(request:NextRequest)=>handle(request,async user=>assign(user,await bodyFor(request)))
