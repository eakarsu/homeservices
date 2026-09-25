/**
 * Job-event notifications (SMS + email).
 *
 * Closes the `gap-no-sms-notifications-backend` stub, which only logged
 * "this is missing" while SMS sending already existed elsewhere in the app.
 *
 *   GET  /api/notifications?jobId=…        list notifications for a job
 *   POST /api/notifications                 send one (or preview without sending)
 *   POST /api/notifications/preview         render a template only
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import {
  NOTIFICATION_EVENTS,
  eventForJobStatus,
  notifyCustomer,
  renderNotification,
  type NotificationChannel,
  type NotificationEvent,
} from '@/lib/workflows/notifications'

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return bad('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId') ?? undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200)

    const rows = await prisma.delivery.findMany({
      where: {
        companyId: user.companyId,
        ...(jobId ? { jobId } : {}),
        // Only notification-type records; the messaging workflow shares this table.
        requestKey: { startsWith: 'notif:' },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ notifications: rows, events: NOTIFICATION_EVENTS })
  } catch (error) {
    console.error('notifications list error:', error)
    return NextResponse.json({ error: 'Could not list notifications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return bad('Unauthorized', 401)

    const body = await request.json().catch(() => ({}))
    const event = body.event as NotificationEvent
    const channel = (body.channel as NotificationChannel) || 'SMS'
    const previewOnly = body.preview === true

    if (!event || !NOTIFICATION_EVENTS.includes(event)) {
      return bad(`event must be one of: ${NOTIFICATION_EVENTS.join(', ')}`)
    }

    // Explicit event, or infer one from a job's current status.
    let resolvedEvent = event
    if (body.inferFromJobStatus && body.jobId) {
      const job = await prisma.job.findFirst({
        where: { id: body.jobId, companyId: user.companyId },
        select: { status: true },
      })
      if (!job) return bad('Job not found', 404)
      const inferred = eventForJobStatus(job.status)
      if (!inferred) return bad(`No notification is defined for job status ${job.status}`)
      resolvedEvent = inferred
    }

    if (previewOnly) {
      const rendered = renderNotification(resolvedEvent, body.templateData ?? {})
      return NextResponse.json({ preview: rendered, event: resolvedEvent })
    }

    if (!body.jobId && !body.estimateId && !body.invoiceId) {
      return bad('One of jobId, estimateId or invoiceId is required')
    }

    const result = await notifyCustomer({
      event: resolvedEvent,
      jobId: body.jobId,
      estimateId: body.estimateId,
      invoiceId: body.invoiceId,
      channel,
      immediate: body.immediate === true,
      actorId: user.id,
      companyId: user.companyId,
      templateOverrides: body.templateData,
    })

    if (result.status === 'NOT_FOUND' || result.status === 'INVALID') {
      return bad(result.error ?? result.status, result.status === 'NOT_FOUND' ? 404 : 400)
    }
    if (result.status === 'OPTED_OUT_OR_UNREACHABLE') {
      return NextResponse.json(result, { status: 409 })
    }
    if (result.status === 'FAILED' || result.status === 'UNKNOWN') {
      return NextResponse.json(result, { status: 502 })
    }

    return NextResponse.json(result, { status: result.status === 'SENT' ? 201 : 202 })
  } catch (error) {
    console.error('notification send error:', error)
    return NextResponse.json({ error: 'Could not send notification' }, { status: 500 })
  }
}