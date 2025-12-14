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
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
    }

    // Verify property belongs to company's customer
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        customer: { companyId: session.user.companyId }
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const equipment = await prisma.equipment.findMany({
      where: { propertyId },
      include: {
        serviceHistory: {
          take: 5,
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Get equipment error:', error)
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

    // Verify property belongs to company's customer
    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        customer: { companyId: session.user.companyId }
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const equipment = await prisma.equipment.create({
      data: {
        propertyId: data.propertyId,
        type: data.type,
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        installDate: data.installDate ? new Date(data.installDate) : null,
        installedBy: data.installedBy,
        warrantyExpires: data.warrantyExpires ? new Date(data.warrantyExpires) : null,
        warrantyNotes: data.warrantyNotes,
        location: data.location,
        specs: data.specs,
        lastServiceDate: data.lastServiceDate ? new Date(data.lastServiceDate) : null,
        nextServiceDue: data.nextServiceDue ? new Date(data.nextServiceDue) : null,
        photos: data.photos || [],
        notes: data.notes,
      }
    })

    return NextResponse.json(equipment, { status: 201 })
  } catch (error) {
    console.error('Create equipment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
