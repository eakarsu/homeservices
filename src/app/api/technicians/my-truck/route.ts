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
    const includeStock = searchParams.get('includeStock') === 'true'

    // Find technician by user ID
    const technician = await prisma.technician.findFirst({
      where: { userId: user.id },
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
