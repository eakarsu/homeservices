import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { TEST_CREDENTIALS } from './helpers/testData'

const prisma = new PrismaClient()
const rawToken = `e2e-${crypto.randomBytes(32).toString('base64url')}`
const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
let estimateId = ''

const REVIEW_ATTESTATION = 'I verified the scope, jurisdiction, template, prices, and customer-facing terms'

/**
 * The review route only accepts an authoritative template on an allowlisted host.
 * CI sets TEMPLATE_ALLOWED_HOSTS; local runs read the same value from .env.
 */
function templateSourceUrl() {
  const configured = process.env.TEMPLATE_ALLOWED_HOSTS?.split(',')[0]?.trim()
  if (configured) return `https://${configured}/estimate-v2`
  try {
    const line = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8')
      .split('\n')
      .find(value => value.startsWith('TEMPLATE_ALLOWED_HOSTS='))
    const host = line?.split('=')[1]?.replace(/["']/g, '').split(',')[0]?.trim()
    if (host) return `https://${host}/estimate-v2`
  } catch {
    // Fall through to the CI host when no local environment file is present.
  }
  return 'https://templates.example.test/estimate-v2'
}

test.beforeAll(async () => {
  const estimate = await prisma.estimate.findFirst({
    where: { estimateNumber: { startsWith: 'DEMO-' }, options: { some: {} } },
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

test('a draft estimate completes human review in the dashboard and enters delivery', async ({ page }) => {
  const admin = await prisma.user.findFirstOrThrow({
    where: { email: TEST_CREDENTIALS.admin.email },
    select: { id: true, companyId: true, role: true },
  })
  expect(admin.role).toBe('ADMIN')

  const stamp = Date.now()
  const customer = await prisma.customer.create({ data: {
    companyId: admin.companyId, customerNumber: `E2E-REVIEW-${stamp}`,
    firstName: 'E2E', lastName: 'Review Journey', email: `e2e-review-${stamp}@example.invalid`,
    doNotEmail: false, tags: ['e2e'],
  } })
  const estimate = await prisma.estimate.create({ data: {
    estimateNumber: `E2E-REVIEW-${stamp}`, customerId: customer.id, status: 'DRAFT',
    expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    retentionUntil: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000),
    subtotal: 100, taxAmount: 8, totalAmount: 108,
    options: { create: {
      name: 'Better', sortOrder: 0, subtotal: 100, taxAmount: 8, totalAmount: 108, isRecommended: true,
      lineItems: { create: { description: 'E2E reviewed scope', quantity: 1, unitPrice: 100, totalPrice: 100, sortOrder: 0 } },
    } },
  } })
  const templateSource = templateSourceUrl()

  // The review form must be usable from the draft estimate page; delivery stays blocked until it succeeds.
  await page.goto(`/dashboard/estimates/${estimate.id}`)
  await page.getByRole('button', { name: /complete review/i }).click()
  await page.getByLabel(/jurisdiction/i).fill('NY')
  await page.getByLabel(/template source url/i).fill(templateSource)
  await page.getByLabel(/template effective date/i).fill('2026-01-01')
  await page.getByLabel(/manual price justification/i).fill('E2E fixture line is deliberately not linked to an active pricebook item.')
  await page.getByLabel(/I verified the scope/i).check()
  await page.getByRole('button', { name: /submit review/i }).click()

  await expect(page.locator('.badge').filter({ hasText: 'READY' })).toBeVisible()
  const reviewed = await prisma.estimate.findUniqueOrThrow({ where: { id: estimate.id } })
  expect(reviewed.status).toBe('READY')
  expect(reviewed.reviewedAt).toBeTruthy()
  expect(reviewed.reviewedById).toBeTruthy()
  expect(reviewed.jurisdiction).toBe('NY')
  expect(reviewed.templateSource).toBe(templateSource)
  expect(await prisma.auditEvent.count({ where: { estimateId: estimate.id, action: 'ESTIMATE_HUMAN_REVIEWED' } })).toBe(1)

  // Send is only offered once the delivery route's requirements are met, and it must
  // reach the email provider instead of failing the review gate.
  await expect(page.getByRole('button', { name: /send to customer/i })).toBeVisible()
  const sendResponsePromise = page.waitForResponse(response =>
    response.url().includes(`/api/estimates/${estimate.id}/send`) && response.request().method() === 'POST'
  )
  await page.getByRole('button', { name: /send to customer/i }).click()
  const sendResponse = await sendResponsePromise

  if (sendResponse.status() === 200) {
    const sent = await prisma.estimate.findUniqueOrThrow({ where: { id: estimate.id } })
    expect(sent.status).toBe('SENT')
    expect(sent.approvalTokenHash).toBeTruthy()
  } else {
    // Email delivery is intentionally unconfigured/placeholder in CI. The route must
    // report the provider failure honestly and restore the reviewed record for retry.
    expect(sendResponse.status()).toBe(503)
    await expect(page.getByText(/delivery failed/i)).toBeVisible()
    const failed = await prisma.estimate.findUniqueOrThrow({ where: { id: estimate.id } })
    expect(failed.status).toBe('READY')
    expect(failed.approvalTokenHash).toBeNull()
    expect(await prisma.auditEvent.count({ where: { estimateId: estimate.id, action: 'ESTIMATE_DELIVERY_FAILED' } })).toBe(1)
  }
})

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

test('bulk status changes cannot bypass the governed estimate workflows', async ({ page }) => {
  const admin = await prisma.user.findFirstOrThrow({
    where: { email: TEST_CREDENTIALS.admin.email },
    select: { companyId: true },
  })
  const stamp = Date.now()
  const customer = await prisma.customer.create({ data: {
    companyId: admin.companyId, customerNumber: `E2E-BULK-${stamp}`,
    firstName: 'E2E', lastName: 'Bulk Journey', tags: ['e2e'],
  } })
  const estimate = await prisma.estimate.create({ data: {
    estimateNumber: `E2E-BULK-${stamp}`, customerId: customer.id, status: 'DRAFT',
    expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    retentionUntil: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000),
    subtotal: 50, taxAmount: 4, totalAmount: 54,
  } })

  const approveResponse = await page.request.patch('/api/estimates/bulk', {
    headers: { 'Content-Type': 'application/json' },
    data: { ids: [estimate.id], status: 'APPROVED' },
  })
  expect(approveResponse.status()).toBe(422)

  const deleteResponse = await page.request.delete('/api/estimates/bulk', {
    headers: { 'Content-Type': 'application/json' },
    data: { ids: [estimate.id] },
  })
  expect(deleteResponse.status()).toBe(405)

  const untouched = await prisma.estimate.findUniqueOrThrow({ where: { id: estimate.id } })
  expect(untouched.status).toBe('DRAFT')

  const declinedResponse = await page.request.patch('/api/estimates/bulk', {
    headers: { 'Content-Type': 'application/json' },
    data: { ids: [estimate.id], status: 'DECLINED' },
  })
  expect(declinedResponse.status()).toBe(200)
  expect(await declinedResponse.json()).toEqual({ declined: 1, skipped: 0 })
  const declined = await prisma.estimate.findUniqueOrThrow({ where: { id: estimate.id } })
  expect(declined.status).toBe('DECLINED')
  expect(await prisma.auditEvent.count({ where: { estimateId: estimate.id, action: 'ESTIMATE_DECLINED' } })).toBe(1)
  expect(await prisma.estimateVersion.count({ where: { estimateId: estimate.id } })).toBe(1)
})
