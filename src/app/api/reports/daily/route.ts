import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from "@/lib/apiAuth"

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const jobs = await prisma.job.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        customer: true,
        serviceType: true
      }
    })

    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: { gte: startDate }
      }
    })

    // Group by date
    const dailyData: Record<string, { jobs: number; revenue: number; completed: number }> = {}

    jobs.forEach(job => {
      const date = job.createdAt.toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { jobs: 0, revenue: 0, completed: 0 }
      }
      dailyData[date].jobs++
      if (job.status === 'COMPLETED') {
        dailyData[date].completed++
      }
    })

    invoices.forEach(invoice => {
      const date = invoice.createdAt.toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { jobs: 0, revenue: 0, completed: 0 }
      }
      if (invoice.status === 'PAID') {
        dailyData[date].revenue += Number(invoice.totalAmount)
      }
    })

    return NextResponse.json({
      period: `Last ${days} days`,
      data: Object.entries(dailyData).map(([date, data]) => ({
        date,
        ...data
      })).sort((a, b) => a.date.localeCompare(b.date))
    })
  } catch (error) {
    console.error('Daily report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
