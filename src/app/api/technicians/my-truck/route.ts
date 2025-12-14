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

    // Find technician by user ID
    const technician = await prisma.technician.findFirst({
      where: { userId: session.user.id },
      select: { truckId: true }
    })

    if (!technician || !technician.truckId) {
      return NextResponse.json({ error: 'No truck assigned' }, { status: 404 })
    }

    const truck = await prisma.truck.findUnique({
      where: { id: technician.truckId },
      include: {
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
    })

    if (!truck) {
      return NextResponse.json({ error: 'Truck not found' }, { status: 404 })
    }

    return NextResponse.json(truck)
  } catch (error) {
    console.error('Get my truck error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
