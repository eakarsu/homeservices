import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { seedDemoDataForCompany } from '@/lib/seedDemoData'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { companyName, firstName, lastName, email, phone, password } = await request.json()

    // Validate required fields
    if (!companyName || !firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
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

      // Seed demo data for the new company (includes service types, agreement plans, etc.)
      const demoData = await seedDemoDataForCompany(tx, company.id, user.id)

      return { company, user, demoData }
    })

    // Send verification email
    const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`
    await sendEmail(
      emailTemplates.emailVerification({
        name: firstName,
        verifyUrl,
      })
    )

    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
      companyId: result.company.id,
      userId: result.user.id,
      demoDataCreated: result.demoData,
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
