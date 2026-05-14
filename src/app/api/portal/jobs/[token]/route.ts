import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/portal/jobs/:token
 *
 * Public (no authentication required) customer-facing job status endpoint.
 * Customers receive a unique `portalToken` URL (e.g., in a confirmation email)
 * and can use it to check their job status without logging in.
 *
 * Returns a safe, customer-facing subset of job data:
 *   - job number, status, scheduled window, trade type
 *   - assigned technician first name + status (no private contact info)
 *   - property address (they already know it)
 *   - customer-facing notes / work performed
 *
 * Sensitive fields (amounts, internal notes, company details) are omitted.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const { token } = params

    if (!token || token.length < 8) {
      return NextResponse.json({ error: 'Invalid portal token' }, { status: 400 })
    }

    const job = await prisma.job.findUnique({
      where: { portalToken: token },
      select: {
        id: true,
        jobNumber: true,
        status: true,
        priority: true,
        tradeType: true,
        type: true,
        title: true,
        description: true,
        scheduledStart: true,
        scheduledEnd: true,
        timeWindowStart: true,
        timeWindowEnd: true,
        actualStart: true,
        actualEnd: true,
        completedAt: true,
        workPerformed: true,
        createdAt: true,
        updatedAt: true,

        // Property — customer already knows their own address
        property: {
          select: {
            address: true,
            city: true,
            state: true,
            zip: true,
          },
        },

        // Service type — friendly name for what's being done
        serviceType: {
          select: {
            name: true,
            description: true,
          },
        },

        // Assigned technicians — only first name + status for privacy
        assignments: {
          where: { isPrimary: true },
          select: {
            technician: {
              select: {
                status: true,
                user: {
                  select: {
                    firstName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },

        // Photos the technician has uploaded (AFTER / EQUIPMENT photos are customer-facing)
        photos: {
          where: { type: { in: ['AFTER', 'EQUIPMENT'] } },
          select: {
            id: true,
            filePath: true,
            caption: true,
            type: true,
            takenAt: true,
          },
          orderBy: { takenAt: 'desc' },
        },
      },
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found. The link may be invalid or expired.' },
        { status: 404 },
      )
    }

    // Shape the response for customer consumption
    const primaryAssignment = job.assignments[0]?.technician ?? null

    const response = {
      jobNumber: job.jobNumber,
      status: job.status,
      priority: job.priority,
      tradeType: job.tradeType,
      type: job.type,
      title: job.title,
      description: job.description,

      // Scheduling
      scheduledStart: job.scheduledStart,
      scheduledEnd: job.scheduledEnd,
      timeWindow:
        job.timeWindowStart && job.timeWindowEnd
          ? `${job.timeWindowStart} – ${job.timeWindowEnd}`
          : null,

      // Completion
      actualStart: job.actualStart,
      actualEnd: job.actualEnd,
      completedAt: job.completedAt,
      workPerformed: job.workPerformed,

      // Location
      property: job.property
        ? {
            address: job.property.address,
            city: job.property.city,
            state: job.property.state,
            zip: job.property.zip,
          }
        : null,

      // Service
      serviceType: job.serviceType?.name ?? null,
      serviceDescription: job.serviceType?.description ?? null,

      // Technician (privacy-safe)
      technician: primaryAssignment
        ? {
            firstName: primaryAssignment.user.firstName,
            avatar: primaryAssignment.user.avatar,
            status: primaryAssignment.status,
          }
        : null,

      // Job photos (customer-visible: AFTER and EQUIPMENT types)
      photos: job.photos.map(p => ({
        id: p.id,
        path: p.filePath,
        caption: p.caption,
        type: p.type,
        takenAt: p.takenAt,
      })),

      // Timestamps
      createdAt: job.createdAt,
      lastUpdated: job.updatedAt,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Portal job lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to load job status' },
      { status: 500 },
    )
  }
}
