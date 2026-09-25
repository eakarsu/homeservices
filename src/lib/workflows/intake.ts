import crypto from 'node:crypto'
import { prisma } from '@/lib/prisma'
import type { AuthContext } from '@/lib/operations-governance'
import { audit, fail, json, manager, object, office, text, txFor, version } from './core'
import { bookings } from './scheduling'

const settingsId = (companyId: string) => `booking-settings:${companyId}`
export async function publicBookingInfo(companyId: string) {
  const settings = await prisma.workflowRecord.findFirst({ where: { id: settingsId(companyId), companyId, module: 'booking-settings', status: 'PUBLISHED' } })
  if (!settings) fail('Online booking is not available', 404)
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId }, select: { name: true, timezone: true } })
  const services = await prisma.serviceType.findMany({ where: { companyId, isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' }, take: 100 })
  return { company, services }
}
export function intakeFields(body: Record<string, unknown>) {
  const email = text(body.email, 'email', 254, false).toLowerCase(), phone = text(body.phone, 'phone', 30, false)
  if (email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) fail('Enter a valid email address')
  if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) fail('Enter a phone number with country code')
  if (!email && !phone) fail('Provide an email address or phone number')
  return { name: text(body.name, 'name', 150, false), email, phone, address: text(body.address, 'address', 500, false), notes: text(body.notes, 'request', 4000), serviceTypeId: text(body.serviceTypeId, 'service', 100, false), preferredTime: text(body.preferredTime, 'preferred time', 150, false), contactAuthorized: body.contactAuthorized === true }
}
export async function receiveIntake(companyId: string, source: 'WEB' | 'SMS' | 'VOICE', reference: string, body: Record<string, unknown>) {
  const data = intakeFields(body), id = 'intake:' + crypto.createHash('sha256').update(JSON.stringify([companyId,source,reference])).digest('hex')
  if (source === 'WEB' && !data.contactAuthorized) fail('Confirm that the office may contact you about this request')
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Company" WHERE id = ${companyId} FOR UPDATE`
    if (source === 'WEB') {
      const settings = await tx.workflowRecord.findFirst({ where: { id: settingsId(companyId), companyId, status: 'PUBLISHED' } })
      if (!settings) fail('Online booking is not available', 404)
    }
    const existing = await tx.workflowRecord.findUnique({ where: { id } })
    if (existing) {
      const old = object(existing.data)
      if (source === 'WEB' && JSON.stringify(old.original) !== JSON.stringify(data)) fail('Request reference was reused with different details',409)
      return { received: true, reference: id }
    }
    if (await tx.workflowRecord.count({ where: { companyId, module: 'intake', createdAt: { gt: new Date(Date.now()-3600000) } } }) >= 100) fail('The office is receiving many requests. Please try again later.',429)
    if (data.serviceTypeId && !await tx.serviceType.findFirst({ where: { id: data.serviceTypeId, companyId, isActive: true } })) fail('Service not found',404)
    await tx.workflowRecord.create({ data: { id, companyId, module: 'intake', title: `${source === 'WEB' ? 'Online' : source} request${data.name ? ': '+data.name : ''}`, status: 'NEW', createdById: `intake:${source.toLowerCase()}`, data: json({ source, original: data, ...data }) } })
    return { received: true, reference: id }
  })
}
export async function intakeInbox(user: AuthContext) {
  office(user)
  const rows = await prisma.workflowRecord.findMany({ where: { companyId: user.companyId, module: 'intake' }, orderBy: { createdAt: 'desc' }, take: 200 })
  const setting = await prisma.workflowRecord.findUnique({ where: { id: settingsId(user.companyId) } })
  return { rows, published: setting?.status === 'PUBLISHED', publicUrl: `${process.env.NEXTAUTH_URL}/book/${user.companyId}`, canPublish: ['ADMIN','MANAGER'].includes(user.role) }
}
export async function manageIntake(user: AuthContext, body: Record<string, unknown>) {
  office(user)
  return txFor(user, async tx => {
    if (body.action === 'publish') {
      manager(user)
      if (typeof body.enabled !== 'boolean') fail('Choose whether online booking is enabled')
      const status = body.enabled ? 'PUBLISHED' : 'DRAFT'
      const setting = await tx.workflowRecord.upsert({ where: { id: settingsId(user.companyId) }, create: { id: settingsId(user.companyId), companyId: user.companyId, module: 'booking-settings', title: 'Online booking', status, data: {}, createdById: user.id }, update: { status, version: { increment: 1 } } })
      await audit(tx,user,'BOOKING_PAGE_UPDATED','WorkflowRecord',setting.id,{status}); return { published: body.enabled }
    }
    const row = await tx.workflowRecord.findFirst({ where: { id: text(body.id,'request',100), companyId: user.companyId, module: 'intake' } })
    if (!row) fail('Request not found',404)
    if (row.version !== version(body.version)) fail('Request changed. Reload before continuing.',409)
    if (row.status !== 'NEW') fail('This request has already been handled',409)
    if (!['archive','convert'].includes(String(body.action))) fail('Unknown intake action')
    let customerId: string | null = null, bookingId: string | null = null
    if (body.action === 'convert') {
      if (body.reviewed !== true) fail('Review the customer, service and appointment before creating a booking request')
      customerId = text(body.customerId, 'customer', 100, false)
      if (!customerId) {
        if (body.createCustomer !== true) fail('Select a customer or choose to create one')
        const contact = intakeFields({ ...object(row.data), ...body, notes: body.notes || object(row.data).notes })
        const customer = await tx.customer.create({ data: { companyId: user.companyId, customerNumber: `WEB-${crypto.randomUUID()}`, firstName: text(body.firstName,'first name',100), lastName: text(body.lastName,'last name',100), email: contact.email || null, phone: contact.phone || null, tags: [], notes: contact.address ? `Requested service address: ${contact.address}` : null } })
        customerId = customer.id
      }
      const result = await bookings(user, { customerId, propertyId: body.propertyId, serviceTypeId: body.serviceTypeId, title: body.title, notes: body.notes, startAt: body.startAt, endAt: body.endAt }, 'save')
      if (Array.isArray(result)) fail('Invalid booking result',500)
      bookingId = result.id
    }
    const saved = await tx.workflowRecord.update({ where: { id: row.id }, data: { status: bookingId ? 'CONVERTED' : 'ARCHIVED', customerId, data: json({ ...object(row.data), bookingId }), version: { increment: 1 } } })
    await audit(tx,user,bookingId ? 'INTAKE_BOOKING_CREATED' : 'INTAKE_ARCHIVED','WorkflowRecord',row.id,{bookingId,customerId})
    return { id: saved.id, bookingId }
  })
}
