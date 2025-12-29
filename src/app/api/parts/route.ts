import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/apiAuth"
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {
      companyId: user.companyId,
      isActive: true,
    }

    if (search) {
      where.OR = [
        { partNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = category
    }

    const parts = await prisma.part.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(parts)
  } catch (error) {
    console.error('Get parts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const part = await prisma.part.create({
      data: {
        companyId: user.companyId,
        partNumber: data.partNumber,
        name: data.name,
        description: data.description,
        category: data.category,
        manufacturer: data.manufacturer,
        cost: data.cost || 0,
        price: data.price || 0,
        quantityOnHand: data.quantityOnHand || 0,
        reorderLevel: data.reorderLevel || 5,
        reorderQty: data.reorderQty || 10,
        warehouseLocation: data.warehouseLocation,
        isActive: true,
      },
    })

    return NextResponse.json(part, { status: 201 })
  } catch (error) {
    console.error('Create part error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
