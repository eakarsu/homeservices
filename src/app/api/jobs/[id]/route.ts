import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'

import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const job = await prisma.job.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            phone: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
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
            tradeType: true,
          },
        },
        assignments: {
          include: {
            technician: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('Get job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const existing = await prisma.job.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (data.status !== undefined) updateData.status = data.status
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.scheduledStart !== undefined) updateData.scheduledStart = data.scheduledStart ? new Date(data.scheduledStart) : null
    if (data.scheduledEnd !== undefined) updateData.scheduledEnd = data.scheduledEnd ? new Date(data.scheduledEnd) : null
    if (data.timeWindowStart !== undefined) updateData.timeWindowStart = data.timeWindowStart
    if (data.timeWindowEnd !== undefined) updateData.timeWindowEnd = data.timeWindowEnd
    if (data.estimatedDuration !== undefined) updateData.estimatedDuration = data.estimatedDuration
    if (data.actualDuration !== undefined) updateData.actualDuration = data.actualDuration

    if (data.status === 'IN_PROGRESS' && existing.status !== 'IN_PROGRESS') {
      updateData.actualStart = new Date()
    }
    if (data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      updateData.completedAt = new Date()
      if (existing.actualStart) {
        const duration = Math.round(
          (new Date().getTime() - new Date(existing.actualStart).getTime()) / 60000
        )
        updateData.actualEnd = new Date()
      }
    }

    const job = await prisma.job.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error('Update job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.job.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    await prisma.job.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
