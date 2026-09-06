import {dayBounds} from '@/lib/workflows/calendar'
import {handle,bodyFor,withReceipt} from '@/lib/workflows/core'
import {createJob} from '@/lib/workflows/execution'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { generateJobNumber } from '@/lib/utils'
import crypto from 'crypto'
import { canManageEstimate } from '@/lib/operations-governance'

/** Generates a cryptographically random URL-safe token for the customer portal. */
function generatePortalToken(): string {
  return crypto.randomBytes(24).toString('base64url')
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10') || 10))
    const limit = searchParams.get('limit')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const tradeType = searchParams.get('tradeType')
    const technicianId = searchParams.get('technicianId')
    const filter = searchParams.get('filter')
    const sort = searchParams.get('sort')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const customerId = searchParams.get('customerId')

    const where: Record<string, unknown> = {
      companyId: user.companyId,
    }
    if (user.role === 'TECHNICIAN') {
      if (!user.technicianId) return NextResponse.json({ error: 'Technician profile required' }, { status: 403 })
      where.assignments = { some: { technicianId: user.technicianId } }
    }

    if (search) {
      where.OR = [
        { jobNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (tradeType) {
      where.tradeType = tradeType
    }

    if (technicianId) {
      if (user.role === 'TECHNICIAN' && technicianId !== user.technicianId) {
        return NextResponse.json({ error: 'Cannot query another technician schedule' }, { status: 403 })
      }
      where.assignments = {
        some: { technicianId },
      }
    }

    if (filter === 'today') {
      const company=await prisma.company.findUniqueOrThrow({where:{id:user.companyId},select:{timezone:true}}),{start:today,end:tomorrow}=dayBounds(new Date(),company.timezone)

      where.scheduledStart = {
        gte: today,
        lt: tomorrow,
      }
    }

    // Filter by date range (for schedule page)
    if (startDate && endDate) {
      where.scheduledStart = {
        gte: new Date(startDate),
        lt: new Date(endDate),
      }
    }

    // Filter by customer
    if (customerId) {
      where.customerId = customerId
    }

    let orderBy: Record<string, string> = { createdAt: 'desc' }
    if (sort) {
      const [field, direction] = sort.split(':')
      if(['createdAt','scheduledStart','jobNumber','title','status','priority'].includes(field)&&['asc','desc'].includes(direction||'desc'))orderBy = { [field]: direction || 'desc' }
    }

    const take = limit ? Math.min(1000,Math.max(1,parseInt(limit)||10)) : pageSize

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
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
          serviceType: true,
          assignments: {
            include: {
              technician: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy,
        skip: limit ? 0 : (page - 1) * pageSize,
        take,
      }),
      prisma.job.count({ where }),
    ])

    return NextResponse.json({
      data: jobs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Jobs list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST=(request:NextRequest)=>handle(request,async user=>{const body=await bodyFor(request);return withReceipt(user,request.headers.get('Idempotency-Key'),'job.create',body,()=>createJob(user,body))})
