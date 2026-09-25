import { NextRequest } from 'next/server'
import { handle, bodyFor, withReceipt } from '@/lib/workflows/core'
import { intakeInbox, manageIntake } from '@/lib/workflows/intake'
export const GET = (r: NextRequest) => handle(r, intakeInbox)
export const POST = (r: NextRequest) => handle(r, async user => { const body = await bodyFor(r); return withReceipt(user,r.headers.get('Idempotency-Key'),'intake',body,() => manageIntake(user,body)) })
