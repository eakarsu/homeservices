import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'

import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    // Get job stats
    const [todayJobs, pendingJobs, completedToday] = await Promise.all([
      prisma.job.count({
        where: {
          companyId: user.companyId,
          scheduledStart: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.job.count({
        where: {
          companyId: user.companyId,
          status: 'PENDING',
        },
      }),
      prisma.job.count({
        where: {
          companyId: user.companyId,
          status: 'COMPLETED',
          completedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    ])

    // Get revenue from invoices
    const [todayInvoices, weekInvoices, monthInvoices] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          paidDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          paidDate: {
            gte: weekStart,
          },
        },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          paidDate: {
            gte: monthStart,
          },
        },
        _sum: { totalAmount: true },
      }),
    ])

    // Get technician availability
    const techniciansAvailable = await prisma.technician.count({
      where: {
        status: 'AVAILABLE',
        user: {
          companyId: user.companyId,
          isActive: true,
        },
      },
    })

    // Get open estimates
    const openEstimates = await prisma.estimate.count({
      where: {
        status: { in: ['SENT', 'VIEWED'] },
        customer: {
          companyId: user.companyId,
        },
      },
    })

    // Get overdue invoices
    const overdueInvoices = await prisma.invoice.count({
      where: {
        status: 'OVERDUE',
        customer: {
          companyId: user.companyId,
        },
      },
    })

    // Get expiring agreements (within 30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const expiringAgreements = await prisma.serviceAgreement.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: thirtyDaysFromNow,
          gte: today,
        },
        customer: {
          companyId: user.companyId,
        },
      },
    })

    return NextResponse.json({
      todayJobs,
      pendingJobs,
      completedToday,
      revenue: {
        today: Number(todayInvoices._sum.totalAmount) || 0,
        week: Number(weekInvoices._sum.totalAmount) || 0,
        month: Number(monthInvoices._sum.totalAmount) || 0,
      },
      techniciansAvailable,
      openEstimates,
      overdueInvoices,
      expiringAgreements,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
