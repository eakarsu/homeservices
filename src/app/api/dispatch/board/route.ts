import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const startOfDay = new Date(dateStr)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(dateStr)
    endOfDay.setHours(23, 59, 59, 999)

    // Get all technicians with their status from Technician model
    const technicians = await prisma.user.findMany({
      where: {
        role: 'TECHNICIAN'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        technician: {
          select: {
            id: true,
            status: true
          }
        }
      }
    })

    // Get jobs for the date with assignments
    const jobs = await prisma.job.findMany({
      where: {
        scheduledStart: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        customer: true,
        property: true,
        serviceType: true,
        assignments: {
          include: {
            technician: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    // Group jobs by technician
    const board = technicians.map(tech => {
      const techJobs = jobs.filter(j =>
        j.assignments.some(a => a.technician.userId === tech.id)
      )

      return {
        technician: {
          id: tech.id,
          name: `${tech.firstName || ''} ${tech.lastName || ''}`.trim() || tech.email,
          status: tech.technician?.status || 'AVAILABLE'
        },
        jobs: techJobs.map(j => ({
          id: j.id,
          title: j.title,
          customer: j.customer ? `${j.customer.firstName || ''} ${j.customer.lastName || ''}`.trim() : 'Unknown',
          address: j.property ? `${j.property.address}, ${j.property.city}` : '',
          scheduledTime: j.scheduledStart?.toISOString(),
          status: j.status,
          serviceType: j.serviceType?.name
        }))
      }
    })

    // Unassigned jobs
    const unassignedJobs = jobs
      .filter(j => j.assignments.length === 0)
      .map(j => ({
        id: j.id,
        title: j.title,
        customer: j.customer ? `${j.customer.firstName || ''} ${j.customer.lastName || ''}`.trim() : 'Unknown',
        address: j.property ? `${j.property.address}, ${j.property.city}` : '',
        scheduledTime: j.scheduledStart?.toISOString(),
        status: j.status,
        serviceType: j.serviceType?.name
      }))

    return NextResponse.json({
      date: dateStr,
      technicians: board,
      unassigned: unassignedJobs
    })
  } catch (error) {
    console.error('Dispatch board error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
