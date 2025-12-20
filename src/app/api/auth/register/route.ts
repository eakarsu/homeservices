import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { seedDemoDataForCompany } from '@/lib/seedDemoData'

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
        }
      })

      // Seed demo data for the new company (includes service types, agreement plans, etc.)
      const demoData = await seedDemoDataForCompany(tx, company.id, user.id)

      return { company, user, demoData }
    })

    return NextResponse.json({
      message: 'Registration successful',
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
