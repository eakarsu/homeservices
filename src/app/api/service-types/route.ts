import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceTypes = await prisma.serviceType.findMany({
      where: {
        companyId: session.user.companyId,
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
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const serviceType = await prisma.serviceType.create({
      data: {
        companyId: session.user.companyId,
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
