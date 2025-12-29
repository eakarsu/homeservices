import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { seedDemoDataForCompany } from '@/lib/seedDemoData'

interface MobileAuthRequest {
  provider: 'google' | 'microsoft' | 'apple'
  email: string
  name: string
  providerId: string
  accessToken: string
}

export async function POST(request: NextRequest) {
  try {
    const body: MobileAuthRequest = await request.json()
    const { provider, email, name, providerId } = body

    if (!email || !provider) {
      return NextResponse.json(
        { error: 'Email and provider are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        technician: true,
        company: true
      }
    })

    if (user) {
      // User exists, check if active
      if (!user.isActive) {
        return NextResponse.json(
          { error: 'Account is deactivated' },
          { status: 403 }
        )
      }
    } else {
      // Create new user with company
      const nameParts = (name || '').split(' ')
      const firstName = nameParts[0] || 'User'
      const lastName = nameParts.slice(1).join(' ') || ''

      const result = await prisma.$transaction(async (tx) => {
        // Create company
        const company = await tx.company.create({
          data: {
            name: `${firstName}'s Company`,
            email: email,
            phone: '',
            address: '',
            city: '',
            state: '',
            zip: '',
          }
        })

        // Create user with random password (they'll use OAuth)
        const randomPassword = await hash(Math.random().toString(36), 10)
        const newUser = await tx.user.create({
          data: {
            email: email,
            password: randomPassword,
            firstName,
            lastName,
            role: 'ADMIN',
            companyId: company.id,
            isActive: true,
          },
          include: {
            technician: true,
            company: true
          }
        })

        return { company, user: newUser }
      })

      user = result.user

      // Seed demo data for the new company
      try {
        await prisma.$transaction(async (tx) => {
          await seedDemoDataForCompany(tx, result.company.id, result.user.id)
        })
      } catch (error) {
        console.error('Error seeding demo data:', error)
      }
    }

    // Generate JWT token for mobile app
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        technicianId: user.technician?.id,
        companyId: user.companyId,
        provider: provider
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Return user data and token (matching iOS User model format)
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        phone: null,
        role: user.role,
        technician: user.technician ? {
          id: user.technician.id,
          employeeId: user.technician.employeeId,
          skills: user.technician.skills,
          certifications: user.technician.certifications,
          tradeTypes: user.technician.tradeTypes,
          currentLat: user.technician.currentLat,
          currentLng: user.technician.currentLng,
          lastLocationUpdate: user.technician.lastLocationUpdate,
          status: user.technician.status,
          hireDate: user.technician.hireDate,
          hourlyRate: user.technician.hourlyRate
        } : null,
        companyId: user.companyId,
        createdAt: user.createdAt
      }
    })

  } catch (error) {
    console.error('Mobile auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
