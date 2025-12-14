import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()

    if (!['AVAILABLE', 'ON_JOB', 'OFF_DUTY', 'ON_BREAK'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const technician = await prisma.technician.findFirst({
      where: { userId: session.user.id },
    })

    if (!technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
    }

    const updated = await prisma.technician.update({
      where: { id: technician.id },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
