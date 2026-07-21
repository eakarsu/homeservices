import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { appendAuditEvent, estimateSnapshot } from '@/lib/audit-events'
import { approvalTokenHash, canManageEstimate } from '@/lib/operations-governance'
import { sendEmail } from '@/lib/email'

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] || character)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageEstimate(user)) return NextResponse.json({ error: 'Estimate delivery role required' }, { status: 403 })

  const estimate = await prisma.estimate.findFirst({
    where: { id: (await params).id, customer: { companyId: user.companyId } },
    include: {
      customer: { select: { email: true, firstName: true, lastName: true, companyName: true, doNotEmail: true } },
      options: { orderBy: { sortOrder: 'asc' }, include: { lineItems: { orderBy: { sortOrder: 'asc' } } } },
    },
  })
  if (!estimate) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
  if (estimate.status !== 'READY' || !estimate.reviewedAt || !estimate.reviewedById || !estimate.jurisdiction || !estimate.templateSource) {
    return NextResponse.json({ error: 'Estimate must complete human review before delivery' }, { status: 409 })
  }
  if (!estimate.customer.email || estimate.customer.doNotEmail) return NextResponse.json({ error: 'Customer has no deliverable email address or opted out' }, { status: 422 })
  const now = new Date()
  if (estimate.expirationDate && estimate.expirationDate <= now) return NextResponse.json({ error: 'Expired estimates cannot be sent' }, { status: 409 })

  const rawToken = crypto.randomBytes(32).toString('base64url')
  const tokenHash = approvalTokenHash(rawToken)
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const tokenExpiresAt = estimate.expirationDate && estimate.expirationDate < sevenDays ? estimate.expirationDate : sevenDays
  const baseUrl = new URL(process.env.NEXTAUTH_URL!)
  const approvalUrl = new URL(`/estimates/approve/${rawToken}`, baseUrl).toString()

  const reserved = await prisma.$transaction(async tx => {
    const transition = await tx.estimate.updateMany({
      where: { id: estimate.id, status: 'READY' },
      data: { status: 'DELIVERY_PENDING', approvalTokenHash: tokenHash, approvalTokenExpiresAt: tokenExpiresAt },
    })
    if (transition.count !== 1) return false
    await appendAuditEvent(tx, {
      companyId: user.companyId, actorId: user.id, action: 'ESTIMATE_DELIVERY_QUEUED',
      entityType: 'Estimate', entityId: estimate.id, estimateId: estimate.id, jobId: estimate.jobId,
      payload: { channel: 'email', tokenExpiresAt: tokenExpiresAt.toISOString() },
    })
    return true
  })
  if (!reserved) return NextResponse.json({ error: 'Estimate delivery is already in progress' }, { status: 409 })

  const customerName = estimate.customer.companyName
    || `${estimate.customer.firstName || ''} ${estimate.customer.lastName || ''}`.trim()
    || 'Customer'
  const optionMarkup = estimate.options.map(option => `<li>${escapeHtml(option.name)} — $${Number(option.totalAmount).toFixed(2)}</li>`).join('')
  const delivery = await sendEmail({
    to: estimate.customer.email,
    subject: `Estimate ${estimate.estimateNumber} is ready for review`,
    text: `Hello ${customerName}, review and approve estimate ${estimate.estimateNumber}: ${approvalUrl}`,
    html: `<p>Hello ${escapeHtml(customerName)},</p><p>Your reviewed estimate ${escapeHtml(estimate.estimateNumber)} is ready.</p><ul>${optionMarkup}</ul><p><a href="${escapeHtml(approvalUrl)}">Review and approve estimate</a></p><p>This one-time link expires ${escapeHtml(tokenExpiresAt.toISOString())}.</p>`,
  })

  if (!delivery.success) {
    await prisma.$transaction(async tx => {
      await tx.estimate.updateMany({ where: { id: estimate.id, status: 'DELIVERY_PENDING', approvalTokenHash: tokenHash }, data: { status: 'READY', approvalTokenHash: null, approvalTokenExpiresAt: null } })
      await appendAuditEvent(tx, {
        companyId: user.companyId, actorId: user.id, action: 'ESTIMATE_DELIVERY_FAILED',
        entityType: 'Estimate', entityId: estimate.id, estimateId: estimate.id, jobId: estimate.jobId,
        payload: { channel: 'email', reason: delivery.error || 'provider failure' },
      })
    })
    return NextResponse.json({ error: 'Estimate delivery failed; record remains ready for retry' }, { status: 503 })
  }

  const sent = await prisma.$transaction(async tx => {
    const transition = await tx.estimate.updateMany({
      where: { id: estimate.id, status: 'DELIVERY_PENDING', approvalTokenHash: tokenHash },
      data: { status: 'SENT', version: { increment: 1 } },
    })
    if (transition.count !== 1) throw new Error('Estimate delivery state changed unexpectedly')
    const updated = await tx.estimate.findUniqueOrThrow({
      where: { id: estimate.id }, include: { customer: true, options: { orderBy: { sortOrder: 'asc' }, include: { lineItems: { orderBy: { sortOrder: 'asc' } } } } },
    })
    await tx.estimateVersion.create({ data: {
      estimateId: updated.id, version: updated.version, snapshot: estimateSnapshot(updated), createdById: user.id,
      provenance: { source: 'reviewed-email-delivery', messageId: delivery.messageId || null, tokenExpiresAt: tokenExpiresAt.toISOString() },
    } })
    await appendAuditEvent(tx, {
      companyId: user.companyId, actorId: user.id, action: 'ESTIMATE_SENT',
      entityType: 'Estimate', entityId: updated.id, estimateId: updated.id, jobId: updated.jobId,
      payload: { version: updated.version, channel: 'email', tokenExpiresAt: tokenExpiresAt.toISOString() },
    })
    return updated
  })
  return NextResponse.json({ success: true, estimate: sent })
}
