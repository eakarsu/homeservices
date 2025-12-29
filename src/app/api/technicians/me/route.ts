import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/apiAuth"
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const technician = await prisma.technician.findFirst({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        truck: {
          select: {
            name: true,
            vehicleId: true,
            make: true,
            model: true,
            year: true,
          },
        },
      },
    })

    if (!technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
    }

    // Get completed jobs count
    const completedJobs = await prisma.jobAssignment.count({
      where: {
        technicianId: technician.id,
        job: { status: 'COMPLETED' },
      },
    })

    // Get reviews - simplified, assuming we have a reviews table
    // For now, use placeholder stats
    const stats = {
      completedJobs,
      avgRating: 4.8,
      totalReviews: Math.floor(completedJobs * 0.3),
    }

    return NextResponse.json({
      ...technician,
      skills: technician.tradeTypes || [],
      stats,
    })
  } catch (error) {
    console.error('Get my profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
