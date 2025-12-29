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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        customer: { companyId: user.companyId }
      },
      include: {
        customer: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // In a real implementation, this would send an email
    // For now, just update the status to SENT

    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: { status: 'SENT' }
    })

    // Log communication
    if (invoice.customer.email) {
      await prisma.communication.create({
        data: {
          customerId: invoice.customerId,
          type: 'EMAIL',
          direction: 'outbound',
          subject: `Invoice #${invoice.invoiceNumber}`,
          message: `Invoice sent to ${invoice.customer.email}`,
          status: 'sent'
        }
      })
    }

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('Send invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
