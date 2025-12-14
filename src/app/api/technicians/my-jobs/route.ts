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
    const dateStr = searchParams.get('date')

    // Find technician by user ID
    const technician = await prisma.technician.findFirst({
      where: { userId: session.user.id }
    })

    if (!technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
    }

    const whereClause: Record<string, unknown> = {
      assignments: {
        some: { technicianId: technician.id }
      }
    }

    if (dateStr) {
      const date = new Date(dateStr)
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      whereClause.scheduledStart = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        property: {
          select: {
            address: true,
            city: true,
            state: true,
          },
        },
        serviceType: {
          select: {
            name: true,
            color: true,
          },
        },
      },
      orderBy: [
        { scheduledStart: 'asc' },
      ],
    })

    // Transform jobs to include address info in customer for frontend compatibility
    const transformedJobs = jobs.map(job => ({
      ...job,
      scheduledDate: job.scheduledStart?.toISOString().split('T')[0],
      scheduledTime: job.scheduledStart?.toISOString().split('T')[1]?.substring(0, 5),
      customer: {
        ...job.customer,
        address: job.property?.address || '',
        city: job.property?.city || '',
        state: job.property?.state || '',
      }
    }))

    return NextResponse.json(transformedJobs)
  } catch (error) {
    console.error('Get my jobs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
