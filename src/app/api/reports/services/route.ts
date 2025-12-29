import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from "@/lib/apiAuth"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceTypes = await prisma.serviceType.findMany({
      include: {
        jobs: {
          include: {
            invoices: true
          }
        }
      }
    })

    const report = serviceTypes.map(service => {
      const completedJobs = service.jobs.filter(j => j.status === 'COMPLETED')
      const revenue = service.jobs.reduce((sum, job) => {
        const paidInvoices = job.invoices?.filter(inv => inv.status === 'PAID') || []
        return sum + paidInvoices.reduce((invSum, inv) => invSum + Number(inv.totalAmount), 0)
      }, 0)

      return {
        id: service.id,
        name: service.name,
        totalJobs: service.jobs.length,
        completedJobs: completedJobs.length,
        revenue,
        avgTicket: completedJobs.length > 0 ? revenue / completedJobs.length : 0
      }
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('Services report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
