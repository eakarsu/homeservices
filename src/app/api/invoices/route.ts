import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'

import { prisma } from '@/lib/prisma'
import { generateInvoiceNumber } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {
      customer: {
        companyId: user.companyId,
      },
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
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
            },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Invoices list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Invoice create request body:', JSON.stringify(body, null, 2))

    // Calculate totals
    const lineItems = body.lineItems || []
    const subtotal = lineItems.reduce((sum: number, item: { totalPrice: number }) => sum + (item.totalPrice || 0), 0)
    // taxRate should be a decimal (e.g., 0.05 for 5%), default to 0 if not provided
    const taxRate = typeof body.taxRate === 'number' ? body.taxRate : 0
    console.log('Calculated values - subtotal:', subtotal, 'taxRate:', taxRate)
    const taxAmount = subtotal * taxRate
    const totalAmount = subtotal + taxAmount

    const dueDate = body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        customerId: body.customerId,
        jobId: body.jobId,
        status: body.status || 'DRAFT',
        dueDate,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        paidAmount: 0,
        balanceDue: totalAmount,
        notes: body.notes,
        terms: body.terms,
        lineItems: lineItems.length > 0 ? {
          create: lineItems.map((item: {
            description: string
            quantity: number
            unitPrice: number
            totalPrice: number
            category?: string
            sortOrder?: number
          }, idx: number) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            category: item.category,
            sortOrder: idx,
          })),
        } : undefined,
      },
      include: {
        customer: true,
        job: true,
        lineItems: true,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Create invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
