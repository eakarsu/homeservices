import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/apiAuth"
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const technician = await prisma.technician.findFirst({
      where: {
        id: (await params).id,
        user: { companyId: user.companyId }
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

    const reviews=await prisma.customerReview.aggregate({where:{companyId:user.companyId,jobId:{in:(await prisma.jobAssignment.findMany({where:{technicianId:technician.id,job:{companyId:user.companyId}},select:{jobId:true}})).map(a=>a.jobId)}},_avg:{rating:true},_count:{id:true}})
    return NextResponse.json({
      ...technician,
      stats: {
        completedJobs,
        avgRating: reviews._avg.rating,
        totalReviews: reviews._count.id,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if(!['ADMIN','MANAGER'].includes(user.role))return NextResponse.json({error:'Manager access required'},{status:403})
    const data = await request.json()
    if(data.truckId&&!await prisma.truck.findFirst({where:{id:data.truckId,companyId:user.companyId,isActive:true}}))return NextResponse.json({error:'Truck not found'},{status:404})

    // Verify technician belongs to company
    const existing = await prisma.technician.findFirst({
      where: {
        id: (await params).id,
        user: { companyId: user.companyId }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
    }

    const technician = await prisma.technician.update({
      where: { id: (await params).id },
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

export async function DELETE(request:NextRequest){const user=await getAuthUser(request);return NextResponse.json({error:user?'Technician history is retained; deactivate the user account instead':'Unauthorized'},{status:user?405:401})}
