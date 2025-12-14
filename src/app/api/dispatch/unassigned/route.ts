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

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const jobs = await prisma.job.findMany({
      where: {
        companyId: session.user.companyId,
        status: { in: ['PENDING', 'SCHEDULED'] },
        assignments: { none: {} },
        OR: [
          { scheduledStart: null },
          {
            scheduledStart: {
              gte: today,
              lt: tomorrow,
            },
          },
        ],
      },
      include: {
        property: {
          select: {
            address: true,
            city: true,
          },
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledStart: 'asc' },
      ],
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Unassigned jobs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
