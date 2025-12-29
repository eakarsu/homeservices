import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from "@/lib/apiAuth"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['SENT', 'OVERDUE'] }
      },
      include: {
        customer: true
      }
    })

    const now = new Date()
    const buckets = {
      current: { count: 0, amount: 0, invoices: [] as any[] },
      '1-30': { count: 0, amount: 0, invoices: [] as any[] },
      '31-60': { count: 0, amount: 0, invoices: [] as any[] },
      '61-90': { count: 0, amount: 0, invoices: [] as any[] },
      '90+': { count: 0, amount: 0, invoices: [] as any[] }
    }

    unpaidInvoices.forEach(invoice => {
      const daysOld = Math.floor((now.getTime() - invoice.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      const customerName = invoice.customer
        ? (invoice.customer.companyName || `${invoice.customer.firstName || ''} ${invoice.customer.lastName || ''}`.trim() || 'Unknown')
        : 'Unknown'
      const amount = Number(invoice.totalAmount)
      const invoiceData = {
        id: invoice.id,
        number: invoice.invoiceNumber,
        customer: customerName,
        amount,
        daysOld
      }

      if (daysOld <= 0) {
        buckets.current.count++
        buckets.current.amount += amount
        buckets.current.invoices.push(invoiceData)
      } else if (daysOld <= 30) {
        buckets['1-30'].count++
        buckets['1-30'].amount += amount
        buckets['1-30'].invoices.push(invoiceData)
      } else if (daysOld <= 60) {
        buckets['31-60'].count++
        buckets['31-60'].amount += amount
        buckets['31-60'].invoices.push(invoiceData)
      } else if (daysOld <= 90) {
        buckets['61-90'].count++
        buckets['61-90'].amount += amount
        buckets['61-90'].invoices.push(invoiceData)
      } else {
        buckets['90+'].count++
        buckets['90+'].amount += amount
        buckets['90+'].invoices.push(invoiceData)
      }
    })

    return NextResponse.json({
      totalOutstanding: unpaidInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
      buckets
    })
  } catch (error) {
    console.error('Aging report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
