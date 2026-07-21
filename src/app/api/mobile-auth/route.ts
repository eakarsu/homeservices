import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Unverified mobile social assertions are disabled; use the provisioned OAuth flow.' },
    { status: 410 }
  )
}
