import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'

import { prisma } from '@/lib/prisma'
import { generateEstimateNumber } from '@/lib/utils'
import { canManageEstimate, retentionDate } from '@/lib/operations-governance'
import { appendAuditEvent, estimateSnapshot } from '@/lib/audit-events'

type DraftLine = { description?: unknown; quantity?: unknown; unitPrice?: unknown; category?: unknown; isOptional?: unknown; pricebookItemId?: unknown }
type DraftOption = { name?: unknown; description?: unknown; isRecommended?: unknown; lineItems?: DraftLine[]; taxRate?: unknown }

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10') || 10))
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {
      customer: {
        companyId: user.companyId,
      },
    }
    if (user.role === 'TECHNICIAN') {
      if (!user.technicianId) return NextResponse.json({ error: 'Technician profile required' }, { status: 403 })
      where.job = { assignments: { some: { technicianId: user.technicianId } } }
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { estimateNumber: { contains: search, mode: 'insensitive' } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Sort support
    const sort = searchParams.get('sort')
    let orderBy: Record<string, string> = { createdAt: 'desc' }
    if (sort) {
      const [field, direction] = sort.split(':')
      const allowedFields = ['estimateNumber', 'status', 'totalAmount', 'createdAt', 'createdDate']
      if (allowedFields.includes(field)) {
        orderBy = { [field]: direction === 'asc' ? 'asc' : 'desc' }
      }
    }

    const [rawEstimates, total] = await Promise.all([
      prisma.estimate.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
            },
          },
          job: {
            select: {
              id: true,
              jobNumber: true,
              title: true,
            },
          },
          options: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.estimate.count({ where }),
    ])

    // Calculate Good/Better/Best totals from options
    const estimates = rawEstimates.map(estimate => {
      const options = estimate.options || []
      return {
        ...estimate,
        goodTotal: options[0]?.totalAmount || 0,
        betterTotal: options[1]?.totalAmount || 0,
        bestTotal: options[2]?.totalAmount || 0,
      }
    })

    return NextResponse.json({
      estimates,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Estimates list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!canManageEstimate(user)) return NextResponse.json({ error: 'Estimate authoring role required' }, { status: 403 })

    const body = await request.json()
    if (typeof body.customerId !== 'string' || !Array.isArray(body.options) || body.options.length < 1 || body.options.length > 3) {
      return NextResponse.json({ error: 'customerId and one to three estimate options are required' }, { status: 422 })
    }
    const [customer, job] = await Promise.all([
      prisma.customer.findFirst({ where: { id: body.customerId, companyId: user.companyId }, select: { id: true } }),
      body.jobId ? prisma.job.findFirst({ where: { id: body.jobId, companyId: user.companyId, customerId: body.customerId }, select: { id: true } }) : null,
    ])
    if (!customer || (body.jobId && !job)) return NextResponse.json({ error: 'Customer or job is outside the authenticated company' }, { status: 422 })

    const normalizedOptions = (body.options as DraftOption[]).map((option, optionIndex) => {
      if (typeof option.name !== 'string' || !option.name.trim() || !Array.isArray(option.lineItems) || !option.lineItems.length) throw new Error(`Option ${optionIndex + 1} requires a name and line items`)
      const taxRate = Number(option.taxRate ?? body.taxRate ?? 0)
      if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 0.2) throw new Error(`Option ${optionIndex + 1} tax rate is invalid`)
      const lines = option.lineItems.map((line, lineIndex) => {
        const quantity = Number(line.quantity)
        const unitPrice = Number(line.unitPrice)
        if (typeof line.description !== 'string' || !line.description.trim() || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) throw new Error(`Option ${optionIndex + 1}, line ${lineIndex + 1} is invalid`)
        return {
          description: line.description.trim().slice(0, 500), quantity, unitPrice,
          totalPrice: Math.round(quantity * unitPrice * 100) / 100,
          category: typeof line.category === 'string' ? line.category.slice(0, 100) : undefined,
          sortOrder: lineIndex, isOptional: line.isOptional === true,
          pricebookItemId: typeof line.pricebookItemId === 'string' ? line.pricebookItemId : undefined,
        }
      })
      const subtotal = Math.round(lines.reduce((sum, line) => sum + line.totalPrice, 0) * 100) / 100
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100
      return {
        name: option.name.trim().slice(0, 100),
        description: typeof option.description === 'string' ? option.description.slice(0, 2000) : undefined,
        sortOrder: optionIndex, subtotal, taxAmount, totalAmount: subtotal + taxAmount,
        isRecommended: option.isRecommended === true, lineItems: { create: lines },
      }
    })
    const pricebookIds = [...new Set(normalizedOptions.flatMap(option => option.lineItems.create.map(line => line.pricebookItemId).filter((id): id is string => !!id)))]
    if (pricebookIds.length) {
      const ownedPrices = await prisma.pricebookItem.count({ where: { id: { in: pricebookIds }, companyId: user.companyId, isActive: true } })
      if (ownedPrices !== pricebookIds.length) return NextResponse.json({ error: 'A pricebook source is outside the authenticated company or inactive' }, { status: 422 })
    }
    const selected = normalizedOptions.find(option => option.isRecommended) || normalizedOptions[0]
    const expirationDate = body.expirationDate ? new Date(body.expirationDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    if (Number.isNaN(expirationDate.getTime()) || expirationDate <= new Date()) return NextResponse.json({ error: 'Expiration date must be in the future' }, { status: 422 })

    const estimate = await prisma.$transaction(async tx => {
      const created = await tx.estimate.create({
        data: {
          estimateNumber: generateEstimateNumber(), customerId: customer.id, jobId: job?.id,
          status: 'DRAFT', expirationDate, subtotal: selected.subtotal, taxAmount: selected.taxAmount,
          totalAmount: selected.totalAmount, notes: typeof body.notes === 'string' ? body.notes.slice(0, 5000) : undefined,
          terms: typeof body.terms === 'string' ? body.terms.slice(0, 10000) : undefined,
          retentionUntil: retentionDate(new Date()), options: { create: normalizedOptions },
        },
        include: { customer: true, options: { include: { lineItems: true } } },
      })
      await tx.estimateVersion.create({ data: {
        estimateId: created.id, version: 1, snapshot: estimateSnapshot(created),
        provenance: { source: 'manual-draft', authorId: user.id }, createdById: user.id,
      } })
      await appendAuditEvent(tx, {
        companyId: user.companyId, actorId: user.id, action: 'ESTIMATE_DRAFT_CREATED',
        entityType: 'Estimate', entityId: created.id, estimateId: created.id, jobId: created.jobId,
        payload: { version: 1, totalAmount: Number(created.totalAmount) },
      })
      return created
    })

    return NextResponse.json(estimate, { status: 201 })
  } catch (error) {
    console.error('Create estimate error:', error)
    if (error instanceof Error && /^Option \d+/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
