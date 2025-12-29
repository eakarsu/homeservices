import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/apiAuth"
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const part = await prisma.part.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        truckStock: {
          include: {
            truck: {
              select: {
                id: true,
                name: true,
                vehicleId: true,
              },
            },
          },
        },
      },
    })

    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    return NextResponse.json(part)
  } catch (error) {
    console.error('Get part error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const existing = await prisma.part.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    const part = await prisma.part.update({
      where: { id: params.id },
      data: {
        partNumber: data.partNumber,
        name: data.name,
        description: data.description,
        category: data.category,
        manufacturer: data.manufacturer,
        cost: data.cost,
        price: data.price,
        quantityOnHand: data.quantityOnHand,
        reorderLevel: data.reorderLevel,
        reorderQty: data.reorderQty,
        warehouseLocation: data.warehouseLocation,
        isActive: data.isActive ?? true,
      },
    })

    return NextResponse.json(part)
  } catch (error) {
    console.error('Update part error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.part.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    // Soft delete by setting isActive to false
    await prisma.part.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete part error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
