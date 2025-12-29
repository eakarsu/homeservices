import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  sub: string
  email: string
  role: string
  technicianId?: string
  companyId?: string
}

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify JWT token
    let payload: JWTPayload
    try {
      payload = jwt.verify(
        token,
        process.env.NEXTAUTH_SECRET || 'fallback-secret'
      ) as JWTPayload
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        technician: true,
        company: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      )
    }

    // Return user data (matching iOS User model format)
    return NextResponse.json({
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
    })

  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}
