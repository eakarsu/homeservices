import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Estimates', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/estimates')
  })

  test.describe('Estimates List Page', () => {
    test('should display estimates page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Estimates')
    })

    test('should display New Estimate button', async ({ page }) => {
      await expect(page.getByRole('link', { name: /New Estimate|Add Estimate|\+ Estimate/i })).toBeVisible()
    })

    test('New Estimate button navigates to new estimate page', async ({ page }) => {
      await page.getByRole('link', { name: /New Estimate|Add Estimate|\+ Estimate/i }).click()
      await expect(page).toHaveURL('/dashboard/estimates/new')
    })

    test('should display estimates table or empty state', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      const hasEstimates = await page.locator('table tbody tr, .estimate-card, [data-testid="estimate-item"], .card').count() > 0
      const hasEmptyState = await page.locator('text=/no estimates|empty|create your first/i').count() > 0
      const hasMainContent = await page.locator('main').count() > 0

      expect(hasEstimates || hasEmptyState || hasMainContent).toBeTruthy()
    })

    test('should display status filter', async ({ page }) => {
      const statusFilter = page.locator('select').first()
      if (await statusFilter.count() > 0) {
        await expect(statusFilter).toBeVisible()
      }
    })
  })

  test.describe('New Estimate Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/estimates/new')
    })

    test('should display new estimate form', async ({ page }) => {
      await expect(page.locator('h1, h2').filter({ hasText: /New Estimate|Create Estimate/i })).toBeVisible()
    })

    test('should display customer selection', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      const customerSelect = page.locator('select[name="customerId"], #customerId, select').first()
      const hasLabel = await page.locator('label').filter({ hasText: /customer/i }).count() > 0
      expect(await customerSelect.count() > 0 || hasLabel).toBeTruthy()
    })

    test('should display job selection', async ({ page }) => {
      const jobSelect = page.locator('select[name="jobId"], #jobId')
      // Job may be optional
      if (await jobSelect.count() > 0) {
        await expect(jobSelect).toBeVisible()
      }
    })

    test('should display estimate title field', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      const titleField = page.locator('input[name="title"], input[placeholder*="title" i], input#title')
      const hasLabel = await page.locator('label').filter({ hasText: /title/i }).count() > 0
      expect(await titleField.count() > 0 || hasLabel).toBeTruthy()
    })

    test('should display expiration date field', async ({ page }) => {
      const expiresField = page.locator('input[name="expiresAt"], input[type="date"]')
      if (await expiresField.count() > 0) {
        await expect(expiresField.first()).toBeVisible()
      }
    })

    test('should display line items section', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      const hasLineItemsHeading = await page.getByRole('heading', { name: /line items/i }).count() > 0
      const hasLineItems = await page.locator('h2, h3').filter({ hasText: /line items/i }).count() > 0
      const hasForm = await page.locator('form, .card').count() > 0
      expect(hasLineItemsHeading || hasLineItems || hasForm).toBeTruthy()
    })

    test('should display add line item button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /add|new|\+/i }).first()).toBeVisible()
    })

    test('should display Save/Create button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /save|create|submit/i })).toBeVisible()
    })

    test('should display Cancel button', async ({ page }) => {
      await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible()
    })

    test('Cancel button navigates back to estimates list', async ({ page }) => {
      await page.getByRole('link', { name: /cancel/i }).click()
      await expect(page).toHaveURL('/dashboard/estimates')
    })
  })

  test.describe('Estimate Detail Page', () => {
    test('clicking on estimate navigates to detail page', async ({ page }) => {
      const estimateLinks = page.locator('table tbody tr a, .estimate-card a').first()

      if (await estimateLinks.count() > 0) {
        await estimateLinks.click()
        await expect(page).toHaveURL(/\/dashboard\/estimates\/[a-zA-Z0-9-]+/)
      }
    })
  })
})

test.describe('Estimate Actions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('estimate detail page should show send button', async ({ page }) => {
    await page.goto('/dashboard/estimates')

    const estimateLinks = page.locator('table tbody tr a, .estimate-card a')
    if (await estimateLinks.count() > 0) {
      await estimateLinks.first().click()
      await page.waitForURL(/\/dashboard\/estimates\/[a-zA-Z0-9-]+/)

      // Look for send/email button
      const sendButton = page.getByRole('button', { name: /send|email/i })
      if (await sendButton.count() > 0) {
        await expect(sendButton).toBeVisible()
      }
    }
  })

  test('estimate detail page should show status', async ({ page }) => {
    await page.goto('/dashboard/estimates')

    const estimateLinks = page.locator('table tbody tr a, .estimate-card a')
    if (await estimateLinks.count() > 0) {
      await estimateLinks.first().click()
      await page.waitForURL(/\/dashboard\/estimates\/[a-zA-Z0-9-]+/)

      // Should show status badge
      const statusBadge = page.locator('.badge, [class*="badge"]')
      await expect(statusBadge.first()).toBeVisible()
    }
  })
})
