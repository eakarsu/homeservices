import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const jobs = await prisma.job.findMany({
      where: {
        companyId: user.companyId,
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
