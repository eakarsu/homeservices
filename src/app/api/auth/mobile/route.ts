import { NextRequest, NextResponse } from 'next/server'

interface MobileAuthRequest {
  provider: 'google' | 'microsoft' | 'apple'
  email: string
  name: string
  providerId: string
  accessToken: string
}

export async function POST(request: NextRequest) {
  await request.body?.cancel().catch(() => undefined)
  return NextResponse.json(
    { error: 'Unverified mobile social assertions are disabled; use the provisioned OAuth flow.' },
    { status: 410 }
  )
}
