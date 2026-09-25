import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { sendEmail, emailTemplates, emailConfiguration } from '@/lib/email'
import { validateRuntimeConfig } from '@/lib/runtime-config'

export async function POST(request: NextRequest) {
  try {
    validateRuntimeConfig()
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!emailConfiguration().configured) return NextResponse.json({ error: 'Email delivery is temporarily unavailable. Please try again later.' }, { status: 503 })

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If an eligible account exists, a reset email has been requested. If it does not arrive, try again later.' })
    }

    const token = crypto.randomUUID()
    const hashedToken = await bcrypt.hash(token, 10)
    const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: expiry,
      },
    })

    const resetUrl = new URL(`/reset-password?token=${token}&email=${encodeURIComponent(email)}`, process.env.NEXTAUTH_URL).toString()

    const delivery = await sendEmail({
      ...emailTemplates.passwordReset({
        name: user.firstName,
        resetUrl,
      }), to: email,
    })

    if (!delivery.success) console.error('Password reset email delivery failed')
    return NextResponse.json({ message: 'If an eligible account exists, a reset email has been requested. If it does not arrive, try again later.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
