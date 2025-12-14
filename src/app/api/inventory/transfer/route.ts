import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fromTruckId, toTruckId, partId, quantity } = await request.json()

    if (!fromTruckId || !toTruckId || !partId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid transfer data' }, { status: 400 })
    }

    // Get source stock
    const sourceStock = await prisma.truckStock.findUnique({
      where: {
        truckId_partId: {
          truckId: fromTruckId,
          partId,
        },
      },
    })

    if (!sourceStock || sourceStock.quantity < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
    }

    // Update source stock
    await prisma.truckStock.update({
      where: {
        truckId_partId: {
          truckId: fromTruckId,
          partId,
        },
      },
      data: {
        quantity: sourceStock.quantity - quantity,
      },
    })

    // Update or create destination stock
    await prisma.truckStock.upsert({
      where: {
        truckId_partId: {
          truckId: toTruckId,
          partId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        truckId: toTruckId,
        partId,
        quantity,
        minQuantity: 0,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Transfer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
