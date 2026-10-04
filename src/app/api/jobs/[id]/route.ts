import {handle,bodyFor} from '@/lib/workflows/core'
import {updateJob} from '@/lib/workflows/execution'
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
        estimates: { select: { id: true, estimateNumber: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 10 },
        invoices: { select: { id: true, invoiceNumber: true, status: true, balanceDue: true, reviewedAt: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    if (!canReadJob(user, job)) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const invoiceRows = await prisma.invoice.findMany({ where: { jobId: job.id, customer: { companyId: user.companyId } }, select: { id: true }, take: 501 })
    const invoiceIds = invoiceRows.slice(0, 500).map(invoice => invoice.id)
    const [messageStatuses, checkoutStatuses, refundStatuses] = await Promise.all([
      prisma.delivery.groupBy({ by: ['status'], where: { companyId: user.companyId, jobId: job.id }, _count: { _all: true } }),
      invoiceIds.length ? prisma.paymentCheckout.groupBy({ by: ['status'], where: { companyId: user.companyId, invoiceId: { in: invoiceIds } }, _count: { _all: true } }) : [],
      invoiceIds.length ? prisma.paymentRefund.groupBy({ by: ['status'], where: { companyId: user.companyId, invoiceId: { in: invoiceIds } }, _count: { _all: true } }) : [],
    ])
    return NextResponse.json({ ...job, reconciliation: {
      messages: Object.fromEntries(messageStatuses.map(row => [row.status, row._count._all])),
      checkouts: Object.fromEntries(checkoutStatuses.map(row => [row.status, row._count._all])),
      refunds: Object.fromEntries(refundStatuses.map(row => [row.status, row._count._all])),
      invoiceCoverage: invoiceIds.length,
      invoiceListTruncated: invoiceRows.length > 500,
    } })
  } catch (error) {
    console.error('Get job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const PUT=(request:NextRequest,context:{params:Promise<{id:string}>})=>handle(request,async user=>updateJob(user,(await context.params).id,await bodyFor(request)))

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
