import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const technician = await prisma.technician.findFirst({
      where: {
        id: params.id,
        user: { companyId: session.user.companyId }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        },
        truck: {
          select: {
            id: true,
            name: true,
            vehicleId: true,
            make: true,
            model: true,
            year: true,
          }
        },
      }
    })

    if (!technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
    }

    // Get stats
    const completedJobs = await prisma.jobAssignment.count({
      where: {
        technicianId: technician.id,
        job: { status: 'COMPLETED' }
      }
    })

    const completedJobsData = await prisma.job.findMany({
      where: {
        assignments: { some: { technicianId: technician.id } },
        status: 'COMPLETED',
        actualAmount: { not: null }
      },
      select: {
        actualAmount: true,
        actualStart: true,
        actualEnd: true,
      }
    })

    const revenueGenerated = completedJobsData.reduce(
      (sum, j) => sum + Number(j.actualAmount || 0), 0
    )

    const avgDurations = completedJobsData
      .filter(j => j.actualStart && j.actualEnd)
      .map(j => (new Date(j.actualEnd!).getTime() - new Date(j.actualStart!).getTime()) / 60000)
    
    const avgJobDuration = avgDurations.length > 0
      ? Math.round(avgDurations.reduce((a, b) => a + b, 0) / avgDurations.length)
      : 0

    // Get recent jobs
    const recentJobs = await prisma.job.findMany({
      where: {
        assignments: { some: { technicianId: technician.id } }
      },
      select: {
        id: true,
        jobNumber: true,
        title: true,
        status: true,
        scheduledStart: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { scheduledStart: 'desc' },
      take: 10
    })

    return NextResponse.json({
      ...technician,
      stats: {
        completedJobs,
        avgRating: 4.8, // Placeholder
        totalReviews: Math.floor(completedJobs * 0.3),
        avgJobDuration,
        revenueGenerated,
      },
      recentJobs
    })
  } catch (error) {
    console.error('Get technician error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Verify technician belongs to company
    const existing = await prisma.technician.findFirst({
      where: {
        id: params.id,
        user: { companyId: session.user.companyId }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
    }

    const technician = await prisma.technician.update({
      where: { id: params.id },
      data: {
        employeeId: data.employeeId,
        color: data.color,
        tradeTypes: data.tradeTypes,
        certifications: data.certifications,
        payType: data.payType,
        hourlyRate: data.hourlyRate,
        status: data.status,
        truckId: data.truckId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    return NextResponse.json(technician)
  } catch (error) {
    console.error('Update technician error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.technician.findFirst({
      where: {
        id: params.id,
        user: { companyId: session.user.companyId }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
    }

    await prisma.technician.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete technician error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
