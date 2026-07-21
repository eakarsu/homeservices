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
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

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
      orderBy = { [field]: direction || 'desc' }
    }

    const take = limit ? parseInt(limit) : pageSize

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

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!canManageEstimate(user) && user.role !== 'DISPATCHER') {
      return NextResponse.json({ error: 'Office scheduling role required' }, { status: 403 })
    }

    const body = await request.json()

    const [customer, property, serviceType] = await Promise.all([
      prisma.customer.findFirst({ where: { id: body.customerId, companyId: user.companyId }, select: { id: true } }),
      body.propertyId ? prisma.property.findFirst({ where: { id: body.propertyId, customerId: body.customerId, customer: { companyId: user.companyId } }, select: { id: true, address: true, city: true, state: true, zip: true } }) : null,
      body.serviceTypeId ? prisma.serviceType.findFirst({ where: { id: body.serviceTypeId, companyId: user.companyId }, select: { id: true } }) : null,
    ])
    if (!customer || (body.propertyId && !property) || (body.serviceTypeId && !serviceType)) {
      return NextResponse.json({ error: 'Customer, property, or service type is outside the authenticated company' }, { status: 422 })
    }

    // Get property address if propertyId is provided
    let address = body.address || ''
    let city = body.city || ''
    let state = body.state || ''
    let zip = body.zip || ''

    if (body.propertyId) {
      if (property) {
        address = property.address
        city = property.city
        state = property.state
        zip = property.zip
      }
    }

    const job = await prisma.job.create({
      data: {
        jobNumber: generateJobNumber(),
        companyId: user.companyId,
        customerId: body.customerId,
        propertyId: body.propertyId,
        serviceTypeId: body.serviceTypeId,
        createdById: user.id,
        tradeType: body.tradeType,
        type: body.type || 'SERVICE_CALL',
        status: body.status || 'PENDING',
        priority: body.priority || 'NORMAL',
        title: body.title,
        description: body.description,
        customerPO: body.customerPO,
        scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : null,
        scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : null,
        estimatedDuration: body.estimatedDuration,
        timeWindowStart: body.timeWindowStart,
        timeWindowEnd: body.timeWindowEnd,
        source: body.source,
        estimatedAmount: body.estimatedAmount,
        notes: body.notes,
        tags: body.tags || [],
        portalToken: generatePortalToken(),
      },
      include: {
        customer: true,
        property: true,
        serviceType: true,
      },
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error('Create job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
