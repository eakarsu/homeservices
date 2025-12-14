import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeStock = searchParams.get('includeStock') === 'true'

    const trucks = await prisma.truck.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
      },
      include: {
        technicians: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        stock: includeStock ? {
          include: {
            part: {
              select: {
                id: true,
                partNumber: true,
                name: true,
                category: true,
              },
            },
          },
        } : false,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(trucks)
  } catch (error) {
    console.error('Get trucks error:', error)
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

    const truck = await prisma.truck.create({
      data: {
        companyId: session.user.companyId,
        name: data.name,
        vehicleId: data.vehicleId,
        make: data.make,
        model: data.model,
        year: data.year,
        vin: data.vin,
        isActive: true,
      },
    })

    return NextResponse.json(truck, { status: 201 })
  } catch (error) {
    console.error('Create truck error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
