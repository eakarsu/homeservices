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

    const { truckId, partId, quantity, reason } = await request.json()

    if (!truckId || !partId || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get current stock
    const currentStock = await prisma.truckStock.findUnique({
      where: {
        truckId_partId: {
          truckId,
          partId,
        },
      },
    })

    const newQuantity = (currentStock?.quantity || 0) + quantity

    if (newQuantity < 0) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
    }

    // Update or create stock record
    const updatedStock = await prisma.truckStock.upsert({
      where: {
        truckId_partId: {
          truckId,
          partId,
        },
      },
      update: {
        quantity: newQuantity,
      },
      create: {
        truckId,
        partId,
        quantity: newQuantity,
        minQuantity: 0,
      },
    })

    // Note: Inventory transaction logging would go here if InventoryTransaction model exists

    return NextResponse.json(updatedStock)
  } catch (error) {
    console.error('Adjust inventory error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
