import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()
const rawToken = `e2e-${crypto.randomBytes(32).toString('base64url')}`
const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
let estimateId = ''

test.beforeAll(async () => {
  const estimate = await prisma.estimate.findFirst({
    where: { options: { some: {} } },
    include: { customer: true, options: { orderBy: { sortOrder: 'asc' }, include: { lineItems: true } } },
  })
  if (!estimate?.options[0]) throw new Error('Seeded estimate option is required')
  if (!estimate.options[0].lineItems.length) {
    await prisma.estimateLineItem.create({ data: {
      optionId: estimate.options[0].id, description: 'Validated service scope', quantity: 1,
      unitPrice: estimate.options[0].subtotal, totalPrice: estimate.options[0].subtotal, sortOrder: 0,
    } })
  }
  estimateId = estimate.id
  await prisma.estimate.update({
    where: { id: estimate.id },
    data: {
      status: 'SENT', jurisdiction: 'NY', templateSource: 'https://templates.example.test/estimate-v2',
      templateEffectiveDate: new Date('2026-01-01'), reviewedAt: new Date(),
      reviewedById: await prisma.user.findFirst({ where: { companyId: estimate.customer.companyId, role: 'ADMIN' }, select: { id: true } }).then(user => user?.id),
      approvalTokenHash: tokenHash, approvalTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      approvedAt: null, signedBy: null, signatureHash: null, approvalEvidence: undefined,
    },
  })
})

test.afterAll(async () => prisma.$disconnect())

test('customer selects an option and consumes the one-time electronic-signature token', async ({ page }) => {
  await page.goto(`/estimates/approve/${rawToken}`)
  await expect(page.getByRole('heading', { name: /estimate review and approval/i })).toBeVisible()
  await expect(page.getByText(/template source/i)).toBeVisible()
  await page.getByLabel(/legal name for electronic signature/i).fill('Taylor Customer')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /approve and sign electronically/i }).click()
  await expect(page.getByRole('status')).toContainText(/approved successfully/i)

  const approved = await prisma.estimate.findUniqueOrThrow({ where: { id: estimateId } })
  expect(approved.status).toBe('APPROVED')
  expect(approved.approvalTokenHash).toBeNull()
  expect(approved.signatureHash).toMatch(/^[a-f0-9]{64}$/)
  const [version, audit] = await Promise.all([
    prisma.estimateVersion.findFirst({ where: { estimateId }, orderBy: { version: 'desc' } }),
    prisma.auditEvent.findFirst({ where: { estimateId, action: 'ESTIMATE_CUSTOMER_APPROVED' }, orderBy: { createdAt: 'desc' } }),
  ])
  expect(version?.snapshot).toBeTruthy()
  expect(audit?.eventHash).toMatch(/^[a-f0-9]{64}$/)
})
