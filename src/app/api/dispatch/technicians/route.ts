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

    const technicians = await prisma.technician.findMany({
      where: {
        user: {
          companyId: session.user.companyId,
          isActive: true,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        assignments: {
          where: {
            job: {
              scheduledStart: {
                gte: today,
                lt: tomorrow,
              },
              status: {
                notIn: ['COMPLETED', 'CANCELLED'],
              },
            },
          },
          include: {
            job: {
              select: {
                id: true,
                jobNumber: true,
                title: true,
                status: true,
                priority: true,
                tradeType: true,
                timeWindowStart: true,
                timeWindowEnd: true,
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
            },
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    })

    // Transform to expected format for frontend
    const formattedTechnicians = technicians.map(tech => ({
      id: tech.id,
      user: {
        firstName: tech.user.firstName,
        lastName: tech.user.lastName,
        phone: tech.user.phone,
      },
      status: tech.status,
      tradeTypes: tech.tradeTypes || [],
      currentLat: tech.currentLat ? Number(tech.currentLat) : undefined,
      currentLng: tech.currentLng ? Number(tech.currentLng) : undefined,
      assignments: tech.assignments.map(a => ({
        job: {
          id: a.job.id,
          jobNumber: a.job.jobNumber,
          title: a.job.title,
          status: a.job.status,
          priority: a.job.priority,
          tradeType: a.job.tradeType,
          timeWindowStart: a.job.timeWindowStart,
          timeWindowEnd: a.job.timeWindowEnd,
          property: a.job.property,
          customer: a.job.customer,
        }
      }))
    }))

    return NextResponse.json(formattedTechnicians)
  } catch (error) {
    console.error('Dispatch technicians error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
