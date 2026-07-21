import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendEmail, emailTemplates } from '@/lib/email'
import { validateRuntimeConfig } from '@/lib/runtime-config'

export async function POST(request: NextRequest) {
  try {
    validateRuntimeConfig()
    const { companyName, firstName, lastName, email, phone, password } = await request.json()

    // Validate required fields
    if (!companyName || !firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    if (typeof password !== 'string' || password.length < 12) {
      return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 422 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate verification token
    const verificationToken = crypto.randomUUID()
    const hashedVerificationToken = await bcrypt.hash(verificationToken, 10)
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create company and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
        }
      })

      // Create admin user
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: 'ADMIN',
          isActive: true,
          emailVerified: false,
          verificationToken: hashedVerificationToken,
          verificationTokenExpiry,
        }
      })

      return { company, user }
    })

    // Send verification email
    const verifyUrl = new URL(`/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`, process.env.NEXTAUTH_URL).toString()
    const delivery = await sendEmail(
      emailTemplates.emailVerification({
        name: firstName,
        verifyUrl,
      })
    )

    if (!delivery.success) return NextResponse.json({ error: 'Account created but verification delivery failed; use resend after email service recovery' }, { status: 503 })
    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
      companyId: result.company.id,
      userId: result.user.id,
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
