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

      // Create default service types
      await tx.serviceType.createMany({
        data: [
          { companyId: company.id, name: 'Service Call', tradeType: 'GENERAL', defaultDuration: 60, color: '#3B82F6' },
          { companyId: company.id, name: 'Repair', tradeType: 'GENERAL', defaultDuration: 90, color: '#EF4444' },
          { companyId: company.id, name: 'Maintenance', tradeType: 'GENERAL', defaultDuration: 60, color: '#22C55E' },
          { companyId: company.id, name: 'Installation', tradeType: 'GENERAL', defaultDuration: 240, color: '#8B5CF6' },
        ]
      })

      // Create default agreement plans
      await tx.agreementPlan.createMany({
        data: [
          {
            companyId: company.id,
            name: 'Bronze',
            description: 'Basic maintenance plan',
            tradeType: 'HVAC',
            monthlyPrice: 15,
            annualPrice: 150,
            visitsIncluded: 1,
            discountPct: 10,
            priorityService: false,
            noDiagnosticFee: false,
            includedServices: ['Annual Inspection'],
          },
          {
            companyId: company.id,
            name: 'Silver',
            description: 'Enhanced maintenance plan',
            tradeType: 'HVAC',
            monthlyPrice: 25,
            annualPrice: 250,
            visitsIncluded: 2,
            discountPct: 15,
            priorityService: true,
            noDiagnosticFee: false,
            includedServices: ['Spring Tune-up', 'Fall Tune-up'],
          },
          {
            companyId: company.id,
            name: 'Gold',
            description: 'Premium maintenance plan',
            tradeType: 'HVAC',
            monthlyPrice: 35,
            annualPrice: 350,
            visitsIncluded: 2,
            discountPct: 20,
            priorityService: true,
            noDiagnosticFee: true,
            includedServices: ['Spring Tune-up', 'Fall Tune-up', 'Filter Changes'],
          },
        ]
      })

      // Seed demo data for the new company
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
