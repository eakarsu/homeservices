import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'

import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceTypes = await prisma.serviceType.findMany({
      where: {
        companyId: user.companyId,
        isActive: true,
      },
      orderBy: [
        { tradeType: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(serviceTypes)
  } catch (error) {
    console.error('Get service types error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const serviceType = await prisma.serviceType.create({
      data: {
        companyId: user.companyId,
        name: data.name,
        description: data.description,
        defaultDuration: data.defaultDuration || 60,
        tradeType: data.tradeType || data.category || 'HVAC',
        isActive: true,
      },
    })

    return NextResponse.json(serviceType)
  } catch (error) {
    console.error('Create service type error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
