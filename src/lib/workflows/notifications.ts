/**
 * Job-event notifications (SMS + email).
 *
 * Replaces the `gap-no-sms-notifications-backend` stub. SMS sending already
 * existed (`src/lib/sms.ts`, `src/lib/workflows/communications.ts`) — what was
 * missing was the *notification* domain: named lifecycle events, deterministic
 * templates, consent enforcement, idempotent delivery records, and a way to
 * trigger them from job state changes.
 *
 * Design notes:
 *   - Templates are deterministic string interpolation. No model calls: a
 *     notification must be identical for identical input so a technician can
 *     rely on it and so it can be tested.
 *   - Consent is enforced through `checkContact`, the same rule the messaging
 *     workflow uses (doNotText / doNotEmail / address format).
 *   - Every send is recorded as a `Delivery` row with a `requestKey` so
 *     retries are idempotent and evidence is auditable.
 */
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/sms'
import { sendEmail } from '@/lib/email'
import { checkContact } from '@/lib/workflows/communications'

export type NotificationEvent =
  | 'job_scheduled'
  | 'job_en_route'
  | 'job_in_progress'
  | 'job_completed'
  | 'estimate_ready'
  | 'invoice_ready'
  | 'appointment_reminder'

export const NOTIFICATION_EVENTS: NotificationEvent[] = [
  'job_scheduled',
  'job_en_route',
  'job_in_progress',
  'job_completed',
  'estimate_ready',
  'invoice_ready',
  'appointment_reminder',
]

export type NotificationChannel = 'SMS' | 'EMAIL'

export interface NotificationTemplateData {
  customerName?: string
  jobNumber?: string
  jobTitle?: string
  technicianName?: string
  scheduledAt?: string
  amount?: string
  portalUrl?: string
  companyName?: string
}

export interface RenderedNotification {
  subject: string
  body: string
}

/**
 * SMS has no subject line, so every body carries the job reference itself —
 * otherwise the customer cannot tell which visit the message is about.
 */
function ref(d: NotificationTemplateData): string {
  return d.jobNumber ? ` (ref ${d.jobNumber})` : ''
}

const TEMPLATES: Record<NotificationEvent, (d: NotificationTemplateData) => RenderedNotification> = {
  job_scheduled: (d) => ({
    subject: `Your service visit is scheduled${ref(d)}`.trim(),
    body:
      `Hi ${d.customerName ?? 'there'}, your ${d.jobTitle ?? 'service visit'}${ref(d)} is scheduled for ` +
      `${d.scheduledAt ?? 'the agreed time'}` +
      (d.technicianName ? ` with ${d.technicianName}` : '') +
      `. Reply to this message to reschedule.` +
      (d.companyName ? ` — ${d.companyName}` : ''),
  }),
  job_en_route: (d) => ({
    subject: `Technician en route${ref(d)}`.trim(),
    body:
      `Hi ${d.customerName ?? 'there'}, your technician` +
      (d.technicianName ? ` (${d.technicianName})` : '') +
      ` is on the way for ${d.jobTitle ?? 'your service visit'}${ref(d)}.`,
  }),
  job_in_progress: (d) => ({
    subject: `Work in progress${ref(d)}`.trim(),
    body: `Hi ${d.customerName ?? 'there'}, work has started on ${d.jobTitle ?? 'your service visit'}${ref(d)}.`,
  }),
  job_completed: (d) => ({
    subject: `Job complete${ref(d)}`.trim(),
    body:
      `Hi ${d.customerName ?? 'there'}, ${d.jobTitle ?? 'your service visit'}${ref(d)} is complete.` +
      (d.portalUrl ? ` View details and approve: ${d.portalUrl}` : ''),
  }),
  estimate_ready: (d) => ({
    subject: `Estimate ready for review${ref(d)}`.trim(),
    body:
      `Hi ${d.customerName ?? 'there'}, your estimate${d.amount ? ` (${d.amount})` : ''}${ref(d)} is ready.` +
      (d.portalUrl ? ` Review and approve: ${d.portalUrl}` : ''),
  }),
  invoice_ready: (d) => ({
    subject: `Invoice ready${ref(d)}`.trim(),
    body:
      `Hi ${d.customerName ?? 'there'}, your invoice${d.amount ? ` for ${d.amount}` : ''}${ref(d)} is ready.` +
      (d.portalUrl ? ` Pay online: ${d.portalUrl}` : ''),
  }),
  appointment_reminder: (d) => ({
    subject: `Reminder: service visit${ref(d)}`.trim(),
    body:
      `Reminder: ${d.jobTitle ?? 'your service visit'}${ref(d)} is scheduled for ` +
      `${d.scheduledAt ?? 'the agreed time'}` +
      (d.technicianName ? ` with ${d.technicianName}` : '') +
      `.`,
  }),
}

export function renderNotification(
  event: NotificationEvent,
  data: NotificationTemplateData,
): RenderedNotification {
  const t = TEMPLATES[event]
  if (!t) throw new Error(`Unknown notification event: ${event}`)
  return t(data)
}

/** Deterministic idempotency key: same job + event + recipient + day = one send. */
function requestKey(jobId: string | null, event: string, recipient: string): string {
  const day = new Date().toISOString().slice(0, 10)
  return `notif:${event}:${jobId ?? 'na'}:${recipient}:${day}`
}

export interface NotifyInput {
  event: NotificationEvent
  jobId?: string
  estimateId?: string
  invoiceId?: string
  channel?: NotificationChannel
  /** Send immediately instead of queueing for the automation runner. */
  immediate?: boolean
  /** Actor recorded as the approver of the send. */
  actorId: string
  companyId: string
  templateOverrides?: Partial<NotificationTemplateData>
}

export interface NotifyResult {
  deliveryId: string | null
  channel: NotificationChannel
  recipient: string
  status: string
  providerId?: string
  error?: string
}

/**
 * Notify the customer attached to a job / estimate / invoice.
 *
 * Consent is checked first; an opted-out recipient produces a 409-style result
 * rather than a silent drop, so the office can see it and use another channel.
 */
export async function notifyCustomer(input: NotifyInput): Promise<NotifyResult> {
  const channel: NotificationChannel = input.channel ?? 'SMS'

  // Resolve the subject of the notification and its customer.
  let jobId = input.jobId ?? null
  let customer: {
    id: string; firstName: string | null; lastName: string | null; companyName: string | null
    email: string | null; phone: string | null; mobile: string | null
    doNotEmail: boolean; doNotText: boolean
  } | null = null
  let jobNumber: string | undefined
  let jobTitle: string | undefined
  let scheduledAt: string | undefined
  let technicianName: string | undefined
  let amount: string | undefined

  if (input.jobId) {
    const job = await prisma.job.findFirst({
      where: { id: input.jobId, companyId: input.companyId },
      include: {
        customer: true,
        assignments: {
          where: { isPrimary: true },
          include: { technician: { include: { user: { select: { firstName: true, lastName: true } } } } },
          take: 1,
        },
      },
    })
    if (!job) return { deliveryId: null, channel, recipient: '', status: 'NOT_FOUND', error: 'Job not found' }
    customer = job.customer
    jobNumber = job.jobNumber
    jobTitle = job.title
    scheduledAt = job.scheduledStart ? new Date(job.scheduledStart).toISOString() : undefined
    const techUser = job.assignments?.[0]?.technician?.user
    technicianName = techUser
      ? `${techUser.firstName ?? ''} ${techUser.lastName ?? ''}`.trim()
      : undefined
    jobId = job.id
  } else if (input.invoiceId) {
    // Invoice carries no companyId of its own — scope it through its customer.
    const invoice = await prisma.invoice.findFirst({
      where: { id: input.invoiceId, customer: { companyId: input.companyId } },
      include: { customer: true, job: true },
    })
    if (!invoice) return { deliveryId: null, channel, recipient: '', status: 'NOT_FOUND', error: 'Invoice not found' }
    customer = invoice.customer
    jobNumber = invoice.job?.jobNumber
    jobTitle = invoice.job?.title
    amount = invoice.totalAmount != null ? String(invoice.totalAmount) : undefined
    jobId = invoice.jobId ?? null
  } else if (input.estimateId) {
    const estimate = await prisma.estimate.findFirst({
      where: { id: input.estimateId, customer: { companyId: input.companyId } },
      include: { customer: true, job: true },
    })
    if (!estimate) return { deliveryId: null, channel, recipient: '', status: 'NOT_FOUND', error: 'Estimate not found' }
    customer = estimate.customer
    jobNumber = estimate.job?.jobNumber
    jobTitle = estimate.job?.title
    amount = estimate.totalAmount != null ? String(estimate.totalAmount) : undefined
    jobId = estimate.jobId ?? null
  } else {
    return { deliveryId: null, channel, recipient: '', status: 'INVALID', error: 'jobId, estimateId or invoiceId is required' }
  }

  if (!customer) {
    return { deliveryId: null, channel, recipient: '', status: 'INVALID', error: 'Record has no customer' }
  }

  // Consent + address format (same rules as the messaging workflow).
  let recipient: string
  try {
    recipient = checkContact(customer, channel)
  } catch (e) {
    return {
      deliveryId: null,
      channel,
      recipient: '',
      status: 'OPTED_OUT_OR_UNREACHABLE',
      error: e instanceof Error ? e.message : 'Recipient unreachable on this channel',
    }
  }

  const customerName =
    customer.firstName || customer.lastName
      ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim()
      : customer.companyName ?? undefined

  const rendered = renderNotification(input.event, {
    customerName,
    jobNumber,
    jobTitle,
    scheduledAt,
    technicianName,
    amount,
    companyName: undefined,
    ...input.templateOverrides,
  })

  const key = requestKey(jobId, input.event, recipient)
  const immediate = input.immediate ?? false

  // Idempotent by (companyId, requestKey): a repeat call for the same
  // job+event+recipient+day returns the original delivery instead of resending.
  const existing = await prisma.delivery.findUnique({
    where: { companyId_requestKey: { companyId: input.companyId, requestKey: key } },
  })
  if (existing) {
    return {
      deliveryId: existing.id,
      channel,
      recipient,
      status: existing.status,
      providerId: existing.providerId ?? undefined,
    }
  }

  const delivery = await prisma.delivery.create({
    data: {
      companyId: input.companyId,
      customerId: customer.id,
      jobId,
      channel,
      subject: rendered.subject,
      body: rendered.body,
      recipient,
      contactAuthorized: true,
      status: 'QUEUED',
      scheduledAt: new Date(),
      approvedById: input.actorId,
      approvedAt: new Date(),
      requestKey: key,
      createdById: input.actorId,
    },
  })

  if (!immediate) {
    return { deliveryId: delivery.id, channel, recipient, status: 'QUEUED' }
  }

  // Immediate send through the real providers.
  await prisma.delivery.update({
    where: { id: delivery.id },
    data: { status: 'PROCESSING', attempts: { increment: 1 } },
  })

  try {
    if (channel === 'SMS') {
      const result = await sendSMS(recipient, rendered.body)
      if (!result.success) {
        await prisma.delivery.update({
          where: { id: delivery.id },
          data: { status: 'FAILED', lastError: result.error ?? 'SMS send failed' },
        })
        return {
          deliveryId: delivery.id, channel, recipient,
          status: 'FAILED', error: result.error ?? 'SMS send failed',
        }
      }
      await prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: 'SENT', providerId: result.messageId ?? 'twilio' },
      })
      return {
        deliveryId: delivery.id, channel, recipient,
        status: 'SENT', providerId: result.messageId,
      }
    }

    const result = await sendEmail({
      to: recipient,
      subject: rendered.subject,
      text: rendered.body,
    } as never)
    if (!result?.success) {
      await prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: 'FAILED', lastError: result?.error ?? 'Email send failed' },
      })
      return {
        deliveryId: delivery.id, channel, recipient,
        status: 'FAILED', error: result?.error ?? 'Email send failed',
      }
    }
    await prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: 'SENT', providerId: result.messageId ?? 'smtp' },
    })
    return {
      deliveryId: delivery.id, channel, recipient,
      status: 'SENT', providerId: result.messageId,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Send failed'
    await prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: 'UNKNOWN', lastError: `Delivery outcome uncertain: ${message}. Reconcile before resending.` },
    })
    return {
      deliveryId: delivery.id, channel, recipient,
      status: 'UNKNOWN', error: message,
    }
  }
}

/**
 * Map a job status transition to the notification it should emit.
 * Used by job update handlers so notifications cannot drift from state.
 */
export function eventForJobStatus(status: string): NotificationEvent | null {
  switch (status) {
    case 'SCHEDULED':
    case 'DISPATCHED':
      return 'job_scheduled'
    case 'EN_ROUTE':
      return 'job_en_route'
    case 'IN_PROGRESS':
      return 'job_in_progress'
    case 'COMPLETED':
      return 'job_completed'
    default:
      return null
  }
}