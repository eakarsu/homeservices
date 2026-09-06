import assert from 'node:assert/strict'
import { PrismaClient } from '@prisma/client'
import { loadEnvConfig } from '@next/env'
import { loadDemoData } from '../src/lib/seedDemoData'
loadEnvConfig(process.cwd())
const prisma = new PrismaClient()
async function main() {
  if (process.env.NODE_ENV === 'production' || !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(process.env.DATABASE_URL || '').hostname)) throw new Error('Verification requires a local development database')
  const email = process.env.ADMIN_EMAIL || ''
  const admin = await prisma.user.findUniqueOrThrow({ where: { email } })
  async function snapshot() {
    const companyId = admin.companyId
    const [customers, technicians, jobs, invoices, estimates, parts, trucks, services, pricebook, agreements, plans, notes, payments, followUps] = await Promise.all([
      prisma.customer.count({ where: { companyId } }), prisma.technician.count({ where: { user: { companyId } } }),
      prisma.job.count({ where: { companyId } }), prisma.invoice.count({ where: { customer: { companyId } } }),
      prisma.estimate.count({ where: { customer: { companyId } } }), prisma.part.count({ where: { companyId } }),
      prisma.truck.count({ where: { companyId } }), prisma.serviceType.count({ where: { companyId } }),
      prisma.pricebookItem.count({ where: { companyId } }), prisma.serviceAgreement.count({ where: { customer: { companyId } } }),
      prisma.agreementPlan.count({ where: { companyId } }), prisma.communication.count({ where: { customer: { companyId } } }),
      prisma.payment.count({ where: { invoice: { customer: { companyId } } } }),
      prisma.followUpTask.count({ where: { companyId } }),
    ])
    return { customers, technicians, jobs, invoices, estimates, parts, trucks, services, pricebook, agreements, plans, notes, payments, followUps }
  }
  const before = await snapshot()
  const customer = await prisma.customer.findFirstOrThrow({ where: { companyId: admin.companyId, tags: { has: 'demo' } } })
  await loadDemoData(prisma, email)
  const after = await snapshot()
  assert.deepEqual(after, before, 'Reload must not duplicate records')
  assert.deepEqual(await prisma.customer.findUnique({ where: { id: customer.id } }), customer, 'Reload must preserve existing customer fields and timestamps')
  assert.deepEqual(await prisma.user.findUnique({ where: { id: admin.id } }), admin, 'Reload must preserve administrator account and company')
  assert.ok(Object.values(after).every(count => count >= 15), 'Every main collection must contain at least 15 records')
  console.log(JSON.stringify({ counts: after, idempotent: true, preservesExistingRecords: true }, null, 2))
}
main().catch(error => { console.error(error.message); process.exitCode = 1 }).finally(() => prisma.$disconnect())
