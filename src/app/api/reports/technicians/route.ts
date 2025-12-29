import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from "@/lib/apiAuth"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const technicians = await prisma.user.findMany({
      where: {
        role: 'TECHNICIAN'
      },
      include: {
        technician: {
          include: {
            assignments: {
              include: {
                job: {
                  include: {
                    invoices: true
                  }
                }
              }
            }
          }
        }
      }
    })

    const report = technicians.map(tech => {
      const jobs = tech.technician?.assignments.map(a => a.job) || []
      const completedJobs = jobs.filter(j => j.status === 'COMPLETED')
      const revenue = jobs.reduce((sum, job) => {
        const paidInvoices = job.invoices?.filter(inv => inv.status === 'PAID') || []
        return sum + paidInvoices.reduce((invSum, inv) => invSum + Number(inv.totalAmount), 0)
      }, 0)

      return {
        id: tech.id,
        name: `${tech.firstName || ''} ${tech.lastName || ''}`.trim() || tech.email,
        email: tech.email,
        totalJobs: jobs.length,
        completedJobs: completedJobs.length,
        revenue,
        avgJobTime: 0 // Would need actual time tracking
      }
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('Technicians report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
