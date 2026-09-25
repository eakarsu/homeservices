import { NextRequest } from 'next/server'
import { handle, bodyFor } from '@/lib/workflows/core'
import { integrationReadiness, checkIntegration } from '@/lib/workflows/provider-checks'
export const GET = (r: NextRequest) => handle(r, integrationReadiness)
export const POST = (r: NextRequest) => handle(r, async user => checkIntegration(user, await bodyFor(r)))
