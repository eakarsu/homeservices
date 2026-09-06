import {dayBounds,zonedMidnight} from '@/lib/workflows/calendar'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'

import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if(user.role==='TECHNICIAN')return NextResponse.json({error:'Office dashboard access required'},{status:403})
    const company=await prisma.company.findUniqueOrThrow({where:{id:user.companyId},select:{timezone:true}}), bounds=dayBounds(new Date(),company.timezone),today=bounds.start,tomorrow=bounds.end
    const weekDate=new Date(bounds.date+'T12:00:00Z');weekDate.setUTCDate(weekDate.getUTCDate()-weekDate.getUTCDay());const weekStart=zonedMidnight(weekDate.toISOString().slice(0,10),company.timezone),monthStart=zonedMidnight(bounds.date.slice(0,8)+'01',company.timezone)

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

    // Cash receipts less settled refunds; credits and legacy unverified rows are excluded.
    const netReceipts=async(start:Date)=>{const [payments,refunds]=await Promise.all([
      prisma.payment.aggregate({where:{invoice:{customer:{companyId:user.companyId}},verifiedAt:{gte:start,lt:tomorrow}},_sum:{amount:true}}),
      prisma.paymentRefund.aggregate({where:{companyId:user.companyId,status:'SUCCEEDED',settledAt:{gte:start,lt:tomorrow}},_sum:{amountCents:true}})
    ]);return (Math.round(Number(payments._sum.amount||0)*100)-(refunds._sum.amountCents||0))/100}
    const [todayRevenue,weekRevenue,monthRevenue]=await Promise.all([netReceipts(today),netReceipts(weekStart),netReceipts(monthStart)])

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
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
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
