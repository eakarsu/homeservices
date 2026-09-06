import {zonedMidnight} from '@/lib/workflows/calendar'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')

    // Find technician by user ID
    const technician = await prisma.technician.findFirst({
      where: { userId: user.id }
    })

    // Build where clause - if user is technician, show their jobs; otherwise show all company jobs
    const whereClause: Record<string, unknown> = {companyId:user.companyId}
    if(user.role==='TECHNICIAN'&&!technician)return NextResponse.json({error:'Technician profile required'},{status:403})

    if (technician) {
      // Technician: show only their assigned jobs
      whereClause.assignments = {
        some: { technicianId: technician.id }
      }
    } else {
      // Non-technician (admin, dispatcher, etc.): show all company jobs
      whereClause.companyId = user.companyId
    }

    if (dateStr) {
      if(!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)||!Number.isFinite(Date.parse(dateStr))||new Date(dateStr).toISOString().slice(0,10)!==dateStr)return NextResponse.json({error:'Invalid date'},{status:400})
      const company=await prisma.company.findUniqueOrThrow({where:{id:user.companyId},select:{timezone:true}}),startOfDay=zonedMidnight(dateStr,company.timezone),next=new Date(dateStr+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);const endOfDay=zonedMidnight(next.toISOString().slice(0,10),company.timezone)
      whereClause.scheduledStart = {
        gte: startOfDay,
        lt: endOfDay
      }
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        serviceType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: [
        { scheduledStart: 'asc' },
      ],
    })

    // Return jobs with all required fields for iOS
    const transformedJobs = jobs.map(job => ({
      ...job,
      scheduledDate: job.scheduledStart?.toISOString().split('T')[0],
      scheduledTime: job.scheduledStart?.toISOString().split('T')[1]?.substring(0, 5),
    }))

    return NextResponse.json(transformedJobs)
  } catch (error) {
    console.error('Get my jobs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
