import { NextRequest, NextResponse } from 'next/server'
import { EstimateStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/apiAuth'
import { appendAuditEvent, estimateSnapshot } from '@/lib/audit-events'
import { canManageEstimate } from '@/lib/operations-governance'

// The single-record route only accepts notes/terms edits and blocks every status
// change (`status` and `selectedOption` are rejected with 422). Review, delivery,
// customer signature, expiry and conversion all run through per-estimate workflows
// that require record-specific evidence.
//
// Declining is the one non-review transition an office user may apply in bulk: it
// records a customer/internal decision without approving, delivering or deleting an
// estimate. Every applied change is written to the audit chain and snapshotted.
const BULK_DECLINABLE_STATUSES: EstimateStatus[] = ['DRAFT', 'READY', 'SENT', 'VIEWED']

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Estimate records and versions are retained; expire or decline instead of deleting' },
      { status: 405 }
    )
  } catch (error) {
    console.error('Bulk delete estimates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!canManageEstimate(user)) {
      return NextResponse.json({ error: 'Estimate authoring role required' }, { status: 403 })
    }

    const { ids, status } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100 || ids.some(id => typeof id !== 'string' || !id.trim())) {
      return NextResponse.json({ error: 'Select between 1 and 100 estimates' }, { status: 422 })
    }
    if (status !== 'DECLINED') {
      return NextResponse.json({
        error: 'Only declining estimates can be applied in bulk. Review, delivery, customer signature, expiry and conversion use their dedicated per-estimate workflows.',
      }, { status: 422 })
    }

    const scoped = await prisma.estimate.findMany({
      where: {
        id: { in: ids },
        status: { in: BULK_DECLINABLE_STATUSES },
        customer: { companyId: user.companyId },
      },
      select: { id: true, status: true, version: true },
    })
    if (!scoped.length) {
      return NextResponse.json({ declined: 0, skipped: ids.length })
    }

    const declined = await prisma.$transaction(async tx => {
      let applied = 0
      for (const estimate of scoped) {
        const claimed = await tx.estimate.updateMany({
          where: { id: estimate.id, status: estimate.status, version: estimate.version },
          data: { status: 'DECLINED', version: { increment: 1 } },
        })
        if (claimed.count !== 1) continue
        const updated = await tx.estimate.findUniqueOrThrow({
          where: { id: estimate.id },
          include: { customer: true, options: { orderBy: { sortOrder: 'asc' }, include: { lineItems: { orderBy: { sortOrder: 'asc' } } } } },
        })
        await tx.estimateVersion.create({
          data: {
            estimateId: updated.id, version: updated.version, snapshot: estimateSnapshot(updated),
            provenance: { source: 'office-bulk-decline', previousStatus: estimate.status, actorId: user.id },
            createdById: user.id,
          },
        })
        await appendAuditEvent(tx, {
          companyId: user.companyId, actorId: user.id, action: 'ESTIMATE_DECLINED',
          entityType: 'Estimate', entityId: updated.id, estimateId: updated.id, jobId: updated.jobId,
          payload: { version: updated.version, previousStatus: estimate.status, bulk: true },
        })
        applied += 1
      }
      return applied
    }, { timeout: 20000 })

    return NextResponse.json({ declined, skipped: ids.length - declined })
  } catch (error) {
    console.error('Bulk decline estimates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
