import { Prisma } from '@prisma/client'
import { calculateAuditHash } from './operations-governance'

export async function appendAuditEvent(
  tx: Prisma.TransactionClient,
  input: {
    companyId: string
    actorId?: string | null
    action: string
    entityType: string
    entityId: string
    jobId?: string | null
    estimateId?: string | null
    payload: Prisma.InputJsonValue
  }
) {
  // Serialize writers per company so concurrent events cannot fork the chain.
  await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Company" WHERE "id" = ${input.companyId} FOR UPDATE`)
  const previous = await tx.auditEvent.findFirst({
    where: { companyId: input.companyId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { eventHash: true },
  })
  const createdAt = new Date()
  const previousHash = previous?.eventHash || null
  const eventHash = calculateAuditHash({
    companyId: input.companyId,
    actorId: input.actorId || null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.payload,
    previousHash,
    createdAt,
  })
  return tx.auditEvent.create({
    data: {
      ...input,
      actorId: input.actorId || null,
      jobId: input.jobId || null,
      estimateId: input.estimateId || null,
      previousHash,
      eventHash,
      createdAt,
    },
  })
}

export function estimateSnapshot(estimate: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(estimate)) as Prisma.InputJsonValue
}
