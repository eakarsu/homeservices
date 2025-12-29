import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/apiAuth"
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'month'

    const now = new Date()
    let startDate: Date

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const yearStart = new Date(today.getFullYear(), 0, 1)
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    // Get invoices for revenue calculations
    const invoices = await prisma.invoice.findMany({
      where: {
        customer: { companyId: user.companyId },
        status: 'PAID',
        paidDate: { gte: yearStart },
      },
      select: {
        paidAmount: true,
        paidDate: true,
      },
    })

    const todayRevenue = invoices
      .filter(i => i.paidDate && i.paidDate >= today)
      .reduce((sum, i) => sum + Number(i.paidAmount), 0)

    const weekRevenue = invoices
      .filter(i => i.paidDate && i.paidDate >= weekStart)
      .reduce((sum, i) => sum + Number(i.paidAmount), 0)

    const monthRevenue = invoices
      .filter(i => i.paidDate && i.paidDate >= monthStart)
      .reduce((sum, i) => sum + Number(i.paidAmount), 0)

    const yearRevenue = invoices
      .filter(i => i.paidDate && i.paidDate >= yearStart)
      .reduce((sum, i) => sum + Number(i.paidAmount), 0)

    const lastMonthRevenue = invoices
      .filter(i => i.paidDate && i.paidDate >= lastMonthStart && i.paidDate <= lastMonthEnd)
      .reduce((sum, i) => sum + Number(i.paidAmount), 0)

    const monthOverMonth = lastMonthRevenue > 0
      ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0

    // Get job stats
    const jobs = await prisma.job.findMany({
      where: {
        companyId: user.companyId,
        createdAt: { gte: startDate },
      },
      select: {
        status: true,
        estimatedDuration: true,
        actualAmount: true,
      },
    })

    const completedJobs = jobs.filter(j => j.status === 'COMPLETED')
    const scheduledJobs = jobs.filter(j => ['SCHEDULED', 'DISPATCHED'].includes(j.status))
    const avgDuration = completedJobs.length > 0
      ? Math.round(completedJobs.reduce((sum, j) => sum + (j.estimatedDuration || 0), 0) / completedJobs.length)
      : 0
    const avgRevenue = completedJobs.length > 0
      ? completedJobs.reduce((sum, j) => sum + Number(j.actualAmount || 0), 0) / completedJobs.length
      : 0

    // Get customer stats
    const totalCustomers = await prisma.customer.count({
      where: { companyId: user.companyId },
    })

    const newCustomers = await prisma.customer.count({
      where: {
        companyId: user.companyId,
        createdAt: { gte: startDate },
      },
    })

    // Get technician with most completed jobs
    const techStats = await prisma.jobAssignment.groupBy({
      by: ['technicianId'],
      where: {
        job: {
          companyId: user.companyId,
          status: 'COMPLETED',
          completedAt: { gte: startDate },
        },
      },
      _count: true,
      orderBy: { _count: { technicianId: 'desc' } },
      take: 1,
    })

    let topPerformer = 'N/A'
    if (techStats.length > 0) {
      const tech = await prisma.technician.findUnique({
        where: { id: techStats[0].technicianId },
        include: { user: { select: { firstName: true, lastName: true } } },
      })
      if (tech) {
        topPerformer = `${tech.user.firstName} ${tech.user.lastName}`
      }
    }

    return NextResponse.json({
      revenue: {
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
        year: yearRevenue,
        monthOverMonth,
      },
      jobs: {
        completed: completedJobs.length,
        scheduled: scheduledJobs.length,
        avgDuration,
        avgRevenue,
      },
      technicians: {
        avgJobsPerDay: completedJobs.length / Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))),
        topPerformer,
        utilizationRate: 75, // Placeholder
      },
      customers: {
        new: newCustomers,
        total: totalCustomers,
        repeatRate: 65, // Placeholder
      },
    })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
