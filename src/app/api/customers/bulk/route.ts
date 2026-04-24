import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/apiAuth'

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ids } = await request.json()
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    const result = await prisma.customer.deleteMany({
      where: {
        id: { in: ids },
        companyId: user.companyId,
      },
    })

    return NextResponse.json({ deleted: result.count })
  } catch (error) {
    console.error('Bulk delete customers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ids, status } = await request.json()
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
      return NextResponse.json({ error: 'IDs and status are required' }, { status: 400 })
    }

    const result = await prisma.customer.updateMany({
      where: {
        id: { in: ids },
        companyId: user.companyId,
      },
      data: { status },
    })

    return NextResponse.json({ updated: result.count })
  } catch (error) {
    console.error('Bulk update customers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
