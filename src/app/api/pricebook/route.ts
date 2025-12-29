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
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = category
    }

    const items = await prisma.pricebookItem.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Get pricebook error:', error)
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

    const item = await prisma.pricebookItem.create({
      data: {
        companyId: user.companyId,
        code: data.code,
        name: data.name,
        description: data.description,
        category: data.category || 'Labor',
        type: data.type || 'Flat Rate',
        unitCost: data.unitCost,
        unitPrice: data.unitPrice,
        laborMinutes: data.laborMinutes,
        isActive: true,
        isTaxable: true,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Create pricebook item error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
