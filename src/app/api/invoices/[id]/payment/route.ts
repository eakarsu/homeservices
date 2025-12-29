import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/apiAuth"
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, method, reference, notes } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        customer: {
          companyId: user.companyId,
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        invoiceId: params.id,
        amount,
        method: method || 'CASH',
        reference,
        notes,
        date: new Date(),
      },
    })

    // Update invoice
    const newPaidAmount = Number(invoice.paidAmount) + amount
    const newBalanceDue = Number(invoice.totalAmount) - newPaidAmount
    const newStatus = newBalanceDue <= 0 ? 'PAID' : newPaidAmount > 0 ? 'PARTIAL' : invoice.status

    await prisma.invoice.update({
      where: { id: params.id },
      data: {
        paidAmount: newPaidAmount,
        balanceDue: Math.max(0, newBalanceDue),
        status: newStatus,
        paidDate: newStatus === 'PAID' ? new Date() : null,
      },
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Record payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
