import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint - no auth required
// Only returns limited invoice info for payment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
        lineItems: {
          select: {
            description: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Return limited public info
    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      balanceDue: invoice.balanceDue,
      customerName: invoice.customer.companyName ||
        `${invoice.customer.firstName || ''} ${invoice.customer.lastName || ''}`.trim() ||
        'Customer',
      lineItems: invoice.lineItems,
    })
  } catch (error) {
    console.error('Public invoice fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
