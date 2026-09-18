import { NextRequest, NextResponse } from 'next/server'
import { publicDemoConfig, isPublicDemoUser } from '@/lib/public-demo'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const headers = { 'Cache-Control': 'no-store, private' }
  const provisioned = process.env.PROVISION_ADMIN_EMAIL && process.env.PROVISION_ADMIN_PASSWORD
  const email = provisioned ? process.env.PROVISION_ADMIN_EMAIL : process.env.ADMIN_EMAIL
  const password = provisioned ? process.env.PROVISION_ADMIN_PASSWORD : process.env.ADMIN_PASSWORD
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  const requestOrigin = host ? `${request.nextUrl.protocol}//${host}` : request.nextUrl.origin
  const demo = publicDemoConfig()
  if (demo) {
    const site = new URL(process.env.NEXTAUTH_URL || requestOrigin)
    if ((host || request.nextUrl.host) !== site.host || (origin && origin !== site.origin)) {
      return NextResponse.json({ enabled: false }, { headers })
    }
    const { prisma } = await import('@/lib/prisma')
    const { compare } = await import('bcryptjs')
    const user = await prisma.user.findUnique({ where: { email: demo.email } })
    const available = !!user && isPublicDemoUser(user) && await compare(demo.password, user.password)
    if (!available || request.nextUrl.searchParams.get('status') === '1') {
      return NextResponse.json({ enabled: available }, { headers })
    }
    return NextResponse.json({ enabled: true, email: demo.email, password: demo.password }, { headers })
  }
  const enabled = process.env.NODE_ENV !== 'production'
    && process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'true'
    && ['localhost', '127.0.0.1', '[::1]'].includes(request.nextUrl.hostname)
    && (!origin || origin === requestOrigin)
    && Boolean(email && password)

  if (!enabled || request.nextUrl.searchParams.get('status') === '1') {
    return NextResponse.json({ enabled }, { headers })
  }

  return NextResponse.json(
    { enabled: true, email, password },
    { headers },
  )
}
