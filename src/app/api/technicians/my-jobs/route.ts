import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')

    // Find technician by user ID
    const technician = await prisma.technician.findFirst({
      where: { userId: user.id }
    })

    // Build where clause - if user is technician, show their jobs; otherwise show all company jobs
    const whereClause: Record<string, unknown> = {}

    if (technician) {
      // Technician: show only their assigned jobs
      whereClause.assignments = {
        some: { technicianId: technician.id }
      }
    } else {
      // Non-technician (admin, dispatcher, etc.): show all company jobs
      whereClause.companyId = user.companyId
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
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        serviceType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: [
        { scheduledStart: 'asc' },
      ],
    })

    // Return jobs with all required fields for iOS
    const transformedJobs = jobs.map(job => ({
      ...job,
      scheduledDate: job.scheduledStart?.toISOString().split('T')[0],
      scheduledTime: job.scheduledStart?.toISOString().split('T')[1]?.substring(0, 5),
    }))

    return NextResponse.json(transformedJobs)
  } catch (error) {
    console.error('Get my jobs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
