import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { sendEmail, emailTemplates } from '@/lib/email'
import { validateRuntimeConfig } from '@/lib/runtime-config'

export async function POST(request: NextRequest) {
  try {
    validateRuntimeConfig()
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a verification email has been sent.' })
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email is already verified' })
    }

    const token = crypto.randomUUID()
    const hashedToken = await bcrypt.hash(token, 10)
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: hashedToken,
        verificationTokenExpiry: expiry,
      },
    })

    const verifyUrl = new URL(`/verify-email?token=${token}&email=${encodeURIComponent(email)}`, process.env.NEXTAUTH_URL).toString()

    await sendEmail(
      emailTemplates.emailVerification({
        name: user.firstName,
        verifyUrl,
      })
    )

    return NextResponse.json({ message: 'Verification email sent' })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
