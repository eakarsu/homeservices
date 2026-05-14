import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/apiAuth"
import { prisma } from '@/lib/prisma'
import { parsePaginationParams, buildPaginatedResponse } from '@/lib/pagination'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeStock = searchParams.get('includeStock') === 'true'

    const params = parsePaginationParams(request, 'name')
    params.sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
    const where = { companyId: user.companyId, isActive: true }

    const [trucks, total] = await Promise.all([
      prisma.truck.findMany({
        where,
        include: {
          technicians: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          stock: includeStock
            ? {
                include: {
                  part: { select: { id: true, partNumber: true, name: true, category: true } },
                },
              }
            : false,
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: params.skip,
        take: params.limit,
      }),
      prisma.truck.count({ where }),
    ])

    return NextResponse.json(buildPaginatedResponse(trucks, total, params))
  } catch (error) {
    console.error('Get trucks error:', error)
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

    const truck = await prisma.truck.create({
      data: {
        companyId: user.companyId,
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
