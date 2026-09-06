import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/apiAuth'
import { appendAuditEvent } from '@/lib/audit-events'
import { validFollowUpOrigin, canManageFollowUps, followUpStatuses, objectInput, validateFollowUp } from '@/lib/follow-ups'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageFollowUps(user.role)) return NextResponse.json({ error: 'Office access required' }, { status: 403 })
  const q = request.nextUrl.searchParams
  if (q.get('options') === '1') {
    const assignees = await prisma.user.findMany({ where: { companyId: user.companyId, isActive: true }, select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: 'asc' } })
    const customers = await prisma.customer.findMany({ where: { companyId: user.companyId }, select: { id: true, firstName: true, lastName: true, companyName: true, doNotCall: true, doNotEmail: true, doNotText: true }, orderBy: { firstName: 'asc' } })
    const jobs = await prisma.job.findMany({ where: { companyId: user.companyId }, select: { id: true, customerId: true, title: true, jobNumber: true }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ assignees, customers, jobs })
  }
  const page = Math.max(1, Math.min(10000, Number(q.get('page')) || 1))
  if (!Number.isInteger(page)) return NextResponse.json({ error: 'Invalid page' }, { status: 400 })
  const status = q.get('status') || ''
  if (status && !followUpStatuses.includes(status as typeof followUpStatuses[number])) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  const search = (q.get('search') || '').slice(0, 200)
  const where = { companyId: user.companyId, ...(status && { status }), ...(q.get('overdue') === '1' && { status: 'OPEN', dueAt: { lt: new Date() } }), ...(search && { title: { contains: search, mode: 'insensitive' as const } }) }
  const [data, total, open, overdue, completed] = await Promise.all([
    prisma.followUpTask.findMany({ where, orderBy: [{ dueAt: 'asc' }, { id: 'asc' }], take: 25, skip: (page - 1) * 25, include: { customer: { select: { firstName: true, lastName: true, companyName: true, doNotCall: true, doNotEmail: true, doNotText: true } }, job: { select: { jobNumber: true, title: true } }, assignee: { select: { firstName: true, lastName: true } } } }),
    prisma.followUpTask.count({ where }),
    prisma.followUpTask.count({ where: { companyId: user.companyId, status: 'OPEN' } }),
    prisma.followUpTask.count({ where: { companyId: user.companyId, status: 'OPEN', dueAt: { lt: new Date() } } }),
    prisma.followUpTask.count({ where: { companyId: user.companyId, status: 'COMPLETED' } }),
  ])
  return NextResponse.json({ data, pagination: { page, total, totalPages: Math.max(1, Math.ceil(total / 25)) }, counts: { open, overdue, completed } })
}

async function save(request: NextRequest, editing: boolean) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageFollowUps(user.role)) return NextResponse.json({ error: 'Office access required' }, { status: 403 })
  // Browser requests must originate from this app; bearer clients may omit Origin.
  if (!validFollowUpOrigin(request.headers.get('origin'), process.env.NEXTAUTH_URL || request.url, process.env.NODE_ENV !== 'production')) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  let body, data
  try { body = objectInput(await request.json()); data = validateFollowUp(body) } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid input' }, { status: 400 })
  }
  if (editing && (typeof body.id !== 'string' || !Number.isInteger(body.version))) return NextResponse.json({ error: 'Task ID and version required' }, { status: 400 })
  const customer = await prisma.customer.findFirst({ where: { id: data.customerId, companyId: user.companyId } })
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  if (data.jobId && !await prisma.job.findFirst({ where: { id: data.jobId, companyId: user.companyId, customerId: data.customerId } })) return NextResponse.json({ error: 'Job does not belong to this customer' }, { status: 400 })
  if (data.assigneeId && !await prisma.user.findFirst({ where: { id: data.assigneeId, companyId: user.companyId, isActive: true } })) return NextResponse.json({ error: 'Assignee not found' }, { status: 400 })
  if (data.aiResultId && !await prisma.aIResult.findFirst({ where: { id: data.aiResultId, companyId: user.companyId, customerId: data.customerId, jobId: data.jobId, feature: 'follow-up-draft', success: true } })) return NextResponse.json({ error: 'AI draft does not match this task' }, { status: 400 })
  try {
    const saved = await prisma.$transaction(async tx => {
      const current = editing ? await tx.followUpTask.findFirst({ where: { id: body.id as string, companyId: user.companyId } }) : null
      if (editing && !current) throw new Error('NOT_FOUND')
      const completedAt = data.status === 'COMPLETED' ? current?.completedAt || new Date() : null
      let task
      if (current) {
        const updated = await tx.followUpTask.updateMany({ where: { id: current.id, companyId: user.companyId, version: body.version as number }, data: { ...data, completedAt, version: { increment: 1 } } })
        if (!updated.count) throw new Error('CONFLICT')
        task = await tx.followUpTask.findUniqueOrThrow({ where: { id: current.id } })
      } else task = await tx.followUpTask.create({ data: { ...data, completedAt, companyId: user.companyId } })
      await appendAuditEvent(tx, { companyId: user.companyId, actorId: user.id, action: editing ? 'FOLLOW_UP_UPDATED' : 'FOLLOW_UP_CREATED', entityType: 'FollowUpTask', entityId: task.id, jobId: task.jobId, payload: { status: task.status, version: task.version, assigneeId: task.assigneeId } })
      return task
    })
    return NextResponse.json(saved, { status: editing ? 200 : 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'NOT_FOUND') return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    if (message === 'CONFLICT') return NextResponse.json({ error: 'This task changed. Close and reopen it before saving.' }, { status: 409 })
    console.error('Follow-up save failed')
    return NextResponse.json({ error: 'Unable to save follow-up' }, { status: 500 })
  }
}
export const POST = (request: NextRequest) => save(request, false)
export const PATCH = (request: NextRequest) => save(request, true)
