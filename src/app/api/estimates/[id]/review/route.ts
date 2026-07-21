import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { appendAuditEvent, estimateSnapshot } from '@/lib/audit-events'
import { allowedTemplateHosts } from '@/lib/runtime-config'
import { canManageEstimate, validateEstimateReview } from '@/lib/operations-governance'

const REVIEW_ATTESTATION = 'I verified the scope, jurisdiction, template, prices, and customer-facing terms'
const ESTIMATE_CHANGED = 'ESTIMATE_CHANGED_DURING_REVIEW'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageEstimate(user)) return NextResponse.json({ error: 'Estimate review role required' }, { status: 403 })
  const body = await request.json()
  if (body.attestation !== REVIEW_ATTESTATION) return NextResponse.json({ error: 'Exact human review attestation is required' }, { status: 422 })

  const estimate = await prisma.estimate.findFirst({
    where: { id: (await params).id, customer: { companyId: user.companyId } },
    include: {
      customer: { select: { id: true } },
      job: { select: { id: true, property: { select: { state: true } } } },
      options: { orderBy: { sortOrder: 'asc' }, include: {
        lineItems: { orderBy: { sortOrder: 'asc' }, include: { pricebookItem: { select: { companyId: true, isActive: true, unitPrice: true, updatedAt: true } } } },
      } },
    },
  })
  if (!estimate) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
  if (estimate.status !== 'DRAFT') return NextResponse.json({ error: 'Only a draft estimate can enter review' }, { status: 409 })
  if (estimate.expirationDate && estimate.expirationDate <= new Date()) return NextResponse.json({ error: 'Expired estimates cannot be reviewed' }, { status: 409 })

  const lines = estimate.options.flatMap(option => option.lineItems)
  const unlinked = lines.some(line => !line.pricebookItemId)
  const staleOrForeign = lines.some(line => line.pricebookItem && (
    line.pricebookItem.companyId !== user.companyId
    || !line.pricebookItem.isActive
    || Math.abs(Number(line.unitPrice) - Number(line.pricebookItem.unitPrice)) > 0.01
  ))
  const blockers = validateEstimateReview({
    jurisdiction: body.jurisdiction, propertyState: estimate.job?.property?.state,
    templateSource: body.templateSource, templateEffectiveDate: body.templateEffectiveDate,
    manualPriceReason: body.manualPriceReason, hasUnlinkedPrices: unlinked || staleOrForeign,
    allowedTemplateHosts: allowedTemplateHosts(),
  })
  if (!estimate.options.length || lines.length === 0) blockers.push('At least one priced option is required')
  if (body.sourceAIResultId) {
    const aiResult = await prisma.aIResult.findFirst({
      where: { id: body.sourceAIResultId, companyId: user.companyId, feature: 'quote-generator', success: true }, select: { id: true },
    })
    if (!aiResult) blockers.push('AI draft provenance was not found in this company')
  }
  if (blockers.length) return NextResponse.json({ error: 'Estimate review blocked', blockers: [...new Set(blockers)] }, { status: 422 })

  const templateEffectiveDate = new Date(body.templateEffectiveDate)
  try {
    const updated = await prisma.$transaction(async tx => {
      const claimed = await tx.estimate.updateMany({
        where: { id: estimate.id, status: 'DRAFT', version: estimate.version },
        data: {
          status: 'READY', version: { increment: 1 }, jurisdiction: body.jurisdiction.trim().toUpperCase(),
          templateSource: body.templateSource, templateEffectiveDate, reviewedAt: new Date(), reviewedById: user.id,
        },
      })
      if (claimed.count !== 1) throw new Error(ESTIMATE_CHANGED)
      const reviewed = await tx.estimate.findUniqueOrThrow({
        where: { id: estimate.id },
        include: { customer: true, options: { orderBy: { sortOrder: 'asc' }, include: { lineItems: { orderBy: { sortOrder: 'asc' } } } } },
      })
      await tx.estimateVersion.create({ data: {
        estimateId: reviewed.id, version: reviewed.version, snapshot: estimateSnapshot(reviewed), createdById: user.id,
        provenance: {
          source: body.sourceAIResultId ? 'human-reviewed-ai-draft' : 'human-reviewed-manual-draft',
          sourceAIResultId: body.sourceAIResultId || null, templateSource: body.templateSource,
          templateEffectiveDate: templateEffectiveDate.toISOString(), jurisdiction: body.jurisdiction.trim().toUpperCase(),
          manualPriceReason: body.manualPriceReason || null, attestation: REVIEW_ATTESTATION,
        },
      } })
      await appendAuditEvent(tx, {
        companyId: user.companyId, actorId: user.id, action: 'ESTIMATE_HUMAN_REVIEWED',
        entityType: 'Estimate', entityId: reviewed.id, estimateId: reviewed.id, jobId: reviewed.jobId,
        payload: { version: reviewed.version, jurisdiction: reviewed.jurisdiction, templateSource: reviewed.templateSource, sourceAIResultId: body.sourceAIResultId || null },
      })
      return reviewed
    })
    return NextResponse.json({ estimate: updated, attestation: REVIEW_ATTESTATION })
  } catch (error) {
    if (error instanceof Error && error.message === ESTIMATE_CHANGED) {
      return NextResponse.json({ error: 'Estimate changed while it was being reviewed; reload and review the current version' }, { status: 409 })
    }
    throw error
  }
}
