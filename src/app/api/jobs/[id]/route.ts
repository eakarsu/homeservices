import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { emitJobCompleted } from '@/lib/socket'
import { canEditJob, canReadJob, isValidJobTransition } from '@/lib/operations-governance'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const job = await prisma.job.findFirst({
      where: {
        id: (await params).id,
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
    if (!canReadJob(user, job)) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    return NextResponse.json(job)
  } catch (error) {
    console.error('Get job error:', error)
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

    const data = await request.json()

    const existing = await prisma.job.findFirst({
      where: {
        id: (await params).id,
        companyId: user.companyId,
      },
      include: { assignments: { select: { technicianId: true } } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    if (!canEditJob(user, existing)) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    if (data.status !== undefined && !isValidJobTransition(existing.status, data.status)) {
      return NextResponse.json({ error: `Invalid job transition: ${existing.status} to ${data.status}` }, { status: 409 })
    }
    if (user.role === 'TECHNICIAN') {
      const allowedFields = new Set(['status', 'workPerformed', 'customerSignature'])
      if (Object.keys(data).some(field => !allowedFields.has(field))) return NextResponse.json({ error: 'Technicians may only update assigned job execution fields' }, { status: 403 })
      if (data.status && !['EN_ROUTE', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'].includes(data.status)) return NextResponse.json({ error: 'Technician status transition is not allowed' }, { status: 403 })
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
    if (data.workPerformed !== undefined) updateData.workPerformed = data.workPerformed
    if (data.customerSignature !== undefined) updateData.customerSignature = data.customerSignature

    if (data.status === 'IN_PROGRESS' && existing.status !== 'IN_PROGRESS') {
      updateData.actualStart = new Date()
    }
    if (data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      const workPerformed = data.workPerformed ?? existing.workPerformed
      const customerSignature = data.customerSignature ?? existing.customerSignature
      if (typeof workPerformed !== 'string' || workPerformed.trim().length < 10 || typeof customerSignature !== 'string' || customerSignature.length < 20) {
        return NextResponse.json({ error: 'Completion requires work performed and a customer signature' }, { status: 422 })
      }
      updateData.completedAt = new Date()
      if (existing.actualStart) {
        updateData.actualEnd = new Date()
      }
    }

    const job = await prisma.job.update({
      where: { id: (await params).id },
      data: updateData,
    })

    // Emit real-time job:completed event when job transitions to COMPLETED
    if (data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      emitJobCompleted({
        jobId: job.id,
        jobNumber: job.jobNumber,
        technicianId: '', // primary technician resolved via room subscription
        completedAt: new Date().toISOString(),
        companyId: job.companyId,
        actualAmount: job.actualAmount ? Number(job.actualAmount) : undefined,
      })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('Update job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Operational jobs are retained; cancel the job instead of deleting it' }, { status: 405 })
  } catch (error) {
    console.error('Delete job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
