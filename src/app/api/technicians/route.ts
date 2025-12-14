import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const technicians = await prisma.technician.findMany({
      where: {
        user: {
          companyId: session.user.companyId,
          isActive: true,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        truck: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            assignments: true,
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    })

    return NextResponse.json(technicians)
  } catch (error) {
    console.error('Get technicians error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    // Create user and technician in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user account
      const hashedPassword = await bcrypt.hash(data.password || 'TempPass123!', 10)

      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: 'TECHNICIAN',
          companyId: session.user.companyId,
          isActive: true,
        },
      })

      // Create the technician profile
      const technician = await tx.technician.create({
        data: {
          userId: user.id,
          employeeId: data.employeeId,
          color: data.color || '#3B82F6',
          tradeTypes: data.tradeTypes || [],
          certifications: data.certifications || [],
          payType: data.payType || 'HOURLY',
          hourlyRate: data.hourlyRate,
          status: 'AVAILABLE',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      })

      return technician
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Create technician error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
