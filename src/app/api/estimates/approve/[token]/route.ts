import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { appendAuditEvent, estimateSnapshot } from '@/lib/audit-events'
import { approvalTokenHash, sha256 } from '@/lib/operations-governance'

const APPROVAL_ATTESTATION = 'I approve the selected scope, price, and terms and intend to sign electronically'

async function findEstimate(token: string) {
  if (!token || token.length < 32 || token.length > 100) return null
  return prisma.estimate.findFirst({
    where: { approvalTokenHash: approvalTokenHash(token), status: { in: ['SENT', 'VIEWED', 'DELIVERY_PENDING'] } },
    include: {
      customer: { select: { companyId: true, firstName: true, lastName: true, companyName: true } },
      options: { orderBy: { sortOrder: 'asc' }, include: { lineItems: { orderBy: { sortOrder: 'asc' } } } },
    },
  })
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const estimate = await findEstimate((await params).token)
  if (!estimate) return NextResponse.json({ error: 'Approval link is invalid or no longer active' }, { status: 404 })
  if (!estimate.approvalTokenExpiresAt || estimate.approvalTokenExpiresAt <= new Date() || (estimate.expirationDate && estimate.expirationDate <= new Date())) {
    return NextResponse.json({ error: 'Approval link has expired' }, { status: 410 })
  }
  return NextResponse.json({
    estimateNumber: estimate.estimateNumber, expirationDate: estimate.expirationDate,
    jurisdiction: estimate.jurisdiction, templateSource: estimate.templateSource,
    customerName: estimate.customer.companyName || `${estimate.customer.firstName || ''} ${estimate.customer.lastName || ''}`.trim(),
    options: estimate.options.map(option => ({
      id: option.id, name: option.name, description: option.description,
      subtotal: option.subtotal, taxAmount: option.taxAmount, totalAmount: option.totalAmount,
      lineItems: option.lineItems.map(line => ({ description: line.description, quantity: line.quantity, unitPrice: line.unitPrice, totalPrice: line.totalPrice, category: line.category })),
    })),
    attestation: APPROVAL_ATTESTATION,
  })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const body = await request.json()
  if (body.attestation !== APPROVAL_ATTESTATION || body.consent !== true) return NextResponse.json({ error: 'Electronic-signature consent and exact approval attestation are required' }, { status: 422 })
  if (typeof body.signerName !== 'string' || body.signerName.trim().length < 2 || body.signerName.length > 200) return NextResponse.json({ error: 'Signer name is required' }, { status: 422 })
  if (typeof body.signature !== 'string' || body.signature.length < 2 || body.signature.length > 200_000) return NextResponse.json({ error: 'Signature is required and must be at most 200 KB' }, { status: 422 })
  if (typeof body.selectedOptionId !== 'string') return NextResponse.json({ error: 'Selected option is required' }, { status: 422 })

  const estimate = await findEstimate((await params).token)
  if (!estimate) return NextResponse.json({ error: 'Approval link is invalid or no longer active' }, { status: 404 })
  const now = new Date()
  if (!estimate.approvalTokenExpiresAt || estimate.approvalTokenExpiresAt <= now || (estimate.expirationDate && estimate.expirationDate <= now)) return NextResponse.json({ error: 'Approval link has expired' }, { status: 410 })
  const selectedOption = estimate.options.find(option => option.id === body.selectedOptionId)
  if (!selectedOption) return NextResponse.json({ error: 'Selected option does not belong to this estimate' }, { status: 422 })

  const signatureHash = sha256(body.signature)
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  const evidence = {
    signedAt: now.toISOString(), signerName: body.signerName.trim(), selectedOptionId: selectedOption.id,
    selectedOptionTotal: Number(selectedOption.totalAmount), attestation: APPROVAL_ATTESTATION,
    signatureHash, ipHash: sha256(forwardedFor), userAgent: (request.headers.get('user-agent') || 'unknown').slice(0, 500),
  }
  const tokenHash = approvalTokenHash((await params).token)
  const approved = await prisma.$transaction(async tx => {
    const transition = await tx.estimate.updateMany({
      where: { id: estimate.id, approvalTokenHash: tokenHash, status: { in: ['SENT', 'VIEWED', 'DELIVERY_PENDING'] } },
      data: {
        status: 'APPROVED', selectedOption: selectedOption.name, subtotal: selectedOption.subtotal,
        taxAmount: selectedOption.taxAmount, totalAmount: selectedOption.totalAmount,
        approvedAt: now, signedBy: body.signerName.trim(), signatureHash, approvalEvidence: evidence,
        approvalTokenHash: null, approvalTokenExpiresAt: null, version: { increment: 1 },
      },
    })
    if (transition.count !== 1) throw new Error('Approval token was already consumed')
    const updated = await tx.estimate.findUniqueOrThrow({
      where: { id: estimate.id }, include: { customer: true, options: { orderBy: { sortOrder: 'asc' }, include: { lineItems: { orderBy: { sortOrder: 'asc' } } } } },
    })
    await tx.estimateVersion.create({ data: {
      estimateId: updated.id, version: updated.version, snapshot: estimateSnapshot(updated),
      provenance: { source: 'customer-electronic-signature', ...evidence }, createdById: null,
    } })
    await appendAuditEvent(tx, {
      companyId: estimate.customer.companyId, actorId: null, action: 'ESTIMATE_CUSTOMER_APPROVED',
      entityType: 'Estimate', entityId: updated.id, estimateId: updated.id, jobId: updated.jobId,
      payload: { version: updated.version, ...evidence },
    })
    return updated
  })
  return NextResponse.json({ approved: true, estimateNumber: approved.estimateNumber, approvedAt: approved.approvedAt, selectedOption: approved.selectedOption, totalAmount: approved.totalAmount })
}
