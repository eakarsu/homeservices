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
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    const properties = await prisma.property.findMany({
      where: {
        customerId,
        customer: { companyId: session.user.companyId }
      },
      include: {
        equipment: true,
        _count: {
          select: { jobs: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(properties)
  } catch (error) {
    console.error('Get properties error:', error)
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

    // Verify customer belongs to company
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        companyId: session.user.companyId
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const property = await prisma.property.create({
      data: {
        customerId: data.customerId,
        name: data.name,
        type: data.type,
        address: data.address,
        address2: data.address2,
        city: data.city,
        state: data.state,
        zip: data.zip,
        gateCode: data.gateCode,
        accessNotes: data.accessNotes,
        lockboxCode: data.lockboxCode,
        sqFootage: data.sqFootage,
        yearBuilt: data.yearBuilt,
        stories: data.stories,
        hasPets: data.hasPets || false,
        petNotes: data.petNotes,
        notes: data.notes,
      }
    })

    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    console.error('Create property error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
