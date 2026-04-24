import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json()

    if (!email || !token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.verificationToken || !user.verificationTokenExpiry) {
      return NextResponse.json({ error: 'Invalid verification link' }, { status: 400 })
    }

    if (new Date() > user.verificationTokenExpiry) {
      return NextResponse.json({ error: 'Verification link has expired' }, { status: 400 })
    }

    const isValidToken = await bcrypt.compare(token, user.verificationToken)
    if (!isValidToken) {
      return NextResponse.json({ error: 'Invalid verification link' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    })

    return NextResponse.json({ message: 'Email verified successfully' })
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
