import {NextResponse} from 'next/server'
export const GET=()=>NextResponse.json({error:'This legacy link is no longer supported. Contact the office for a new expiring private portal link.'},{status:410,headers:{'Cache-Control':'no-store'}})
