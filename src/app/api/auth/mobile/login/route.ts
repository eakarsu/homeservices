import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import jwt from 'jsonwebtoken'

interface MobileLoginRequest {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body: MobileLoginRequest = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        technician: true,
        company: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      )
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate JWT token for mobile app
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        technicianId: user.technician?.id,
        companyId: user.companyId,
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
        name: `${user.firstName} ${user.lastName}`.trim(),
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
    console.error('Mobile login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
