import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/apiAuth"
import { prisma } from '@/lib/prisma'
import { canManageEstimate } from '@/lib/operations-governance'
import { appendAuditEvent, estimateSnapshot } from '@/lib/audit-events'

const ESTIMATE_CHANGED = 'ESTIMATE_CHANGED_DURING_EDIT'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const estimate = await prisma.estimate.findFirst({
      where: {
        id: (await params).id,
        customer: {
          companyId: user.companyId,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
            assignments: { select: { technicianId: true } },
          },
        },
        options: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lineItems: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    })

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }
    if (user.role === 'TECHNICIAN' && (!user.technicianId || !estimate.job?.assignments.some(item => item.technicianId === user.technicianId))) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    const safeEstimate = estimate.job
      ? { ...estimate, job: { id: estimate.job.id, jobNumber: estimate.job.jobNumber, title: estimate.job.title } }
      : estimate
    return NextResponse.json(safeEstimate)
  } catch (error) {
    console.error('Get estimate error:', error)
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
    if (!canManageEstimate(user)) return NextResponse.json({ error: 'Estimate authoring role required' }, { status: 403 })

    const data = await request.json()

    const existing = await prisma.estimate.findFirst({
      where: {
        id: (await params).id,
        customer: {
          companyId: user.companyId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }
    if (existing.status !== 'DRAFT') return NextResponse.json({ error: 'Reviewed or delivered estimate versions are immutable' }, { status: 409 })
    if (data.status !== undefined || data.selectedOption !== undefined) return NextResponse.json({ error: 'Status and customer option selection use dedicated review/approval workflows' }, { status: 422 })

    const updateData: Record<string, unknown> = {}

    if (data.notes !== undefined) updateData.notes = typeof data.notes === 'string' ? data.notes.slice(0, 5000) : null
    if (data.terms !== undefined) updateData.terms = typeof data.terms === 'string' ? data.terms.slice(0, 10000) : null
    updateData.version = { increment: 1 }

    const estimate = await prisma.$transaction(async tx => {
      const claimed = await tx.estimate.updateMany({
        where: { id: (await params).id, status: 'DRAFT', version: existing.version }, data: updateData,
      })
      if (claimed.count !== 1) throw new Error(ESTIMATE_CHANGED)
      const updated = await tx.estimate.findUniqueOrThrow({
        where: { id: (await params).id },
        include: { customer: true, options: { orderBy: { sortOrder: 'asc' }, include: { lineItems: { orderBy: { sortOrder: 'asc' } } } } },
      })
      await tx.estimateVersion.create({ data: {
        estimateId: updated.id, version: updated.version, snapshot: estimateSnapshot(updated),
        provenance: { source: 'manual-draft-edit', authorId: user.id }, createdById: user.id,
      } })
      await appendAuditEvent(tx, {
        companyId: user.companyId, actorId: user.id, action: 'ESTIMATE_DRAFT_EDITED',
        entityType: 'Estimate', entityId: updated.id, estimateId: updated.id, jobId: updated.jobId,
        payload: { version: updated.version, changedFields: Object.keys(updateData).filter(key => key !== 'version') },
      })
      return updated
    })

    return NextResponse.json(estimate)
  } catch (error) {
    if (error instanceof Error && error.message === ESTIMATE_CHANGED) {
      return NextResponse.json({ error: 'Estimate changed while it was being edited; reload the current draft' }, { status: 409 })
    }
    console.error('Update estimate error:', error)
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

    const existing = await prisma.estimate.findFirst({
      where: {
        id: (await params).id,
        customer: {
          companyId: user.companyId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Estimate records and versions are retained; expire or decline instead of deleting' }, { status: 405 })
  } catch (error) {
    console.error('Delete estimate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
