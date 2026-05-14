import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { generateJobNumber } from '@/lib/utils'
import { callAI } from '@/lib/ai'
import crypto from 'crypto'

/** Generates a cryptographically random URL-safe token for the customer portal. */
function generatePortalToken(): string {
  return crypto.randomBytes(24).toString('base64url')
}

/**
 * Auto-dispatch: when a new job is created, asynchronously ask the AI
 * to suggest the best available technician. The suggestion is logged and
 * stored on the job record (dispatchSuggestion field) if it exists,
 * otherwise just logged. The dispatch board can surface this to operators.
 */
async function runAutoDispatch(
  jobId: string,
  jobNumber: string,
  companyId: string,
  tradeType: string,
): Promise<void> {
  try {
    // Fetch available technicians for the company with matching trade
    const technicians = await prisma.technician.findMany({
      where: {
        user: { companyId, isActive: true },
        status: { in: ['AVAILABLE'] },
        tradeTypes: { has: tradeType as never },
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        assignments: {
          where: { job: { status: { in: ['SCHEDULED', 'IN_PROGRESS', 'EN_ROUTE'] } } },
          select: { id: true },
        },
      },
      take: 10,
    })

    if (technicians.length === 0) {
      console.log(`[auto-dispatch] No available ${tradeType} technicians for job ${jobNumber}`)
      return
    }

    const techList = technicians.map((t, i) => ({
      index: i + 1,
      id: t.id,
      name: `${t.user.firstName} ${t.user.lastName}`,
      currentJobs: t.assignments.length,
      skills: t.tradeTypes,
    }))

    const prompt = `A new ${tradeType} job (${jobNumber}) was just created.
Available technicians:
${techList.map(t => `${t.index}. ${t.name} — active jobs: ${t.currentJobs}, skills: ${t.skills.join(', ')}`).join('\n')}

Suggest the best technician to assign and briefly explain why (1-2 sentences).
Respond ONLY with JSON: {"technicianId": "<id>", "technicianName": "<name>", "reason": "<explanation>"}`

    const aiResponse = await callAI(
      [{ role: 'user', content: prompt }],
      { temperature: 0.2, maxTokens: 200 },
    )

    const parsed = JSON.parse(aiResponse) as {
      technicianId: string
      technicianName: string
      reason: string
    }

    console.log(
      `[auto-dispatch] Job ${jobNumber} → suggested technician: ${parsed.technicianName} — ${parsed.reason}`,
    )

    // Persist the suggestion on the job if the schema supports it (non-fatal if not)
    try {
      await (prisma.job as any).update({
        where: { id: jobId },
        data: { dispatchSuggestion: JSON.stringify(parsed) },
      })
    } catch {
      // Field doesn't exist yet — suggestion lives in the logs only
    }
  } catch (err) {
    console.error(`[auto-dispatch] Failed for job ${jobNumber}:`, err)
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
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

    const body = await request.json()

    // Get property address if propertyId is provided
    let address = body.address || ''
    let city = body.city || ''
    let state = body.state || ''
    let zip = body.zip || ''

    if (body.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: body.propertyId },
      })
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

    // ---- Auto-dispatch suggestion ----
    // Fire-and-forget: run AI dispatch suggestion in background.
    // Does NOT block the response — result is logged and can be consumed
    // via the dispatch board or a follow-up GET /api/ai/optimize-dispatch.
    runAutoDispatch(job.id, job.jobNumber, user.companyId, job.tradeType).catch(
      (err) => console.error('[auto-dispatch] background error:', err),
    )

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error('Create job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
