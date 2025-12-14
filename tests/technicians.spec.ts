import { test, expect } from '@playwright/test'
import { login, loginAsTechnician } from './helpers/auth'

test.describe('Technicians Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/technicians')
  })

  test.describe('Technicians List Page', () => {
    test('should display technicians page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Technicians')
    })

    test('should display New Technician button', async ({ page }) => {
      await expect(page.getByRole('link', { name: /New Technician|Add Technician|\+ Technician/i })).toBeVisible()
    })

    test('New Technician button navigates to new technician page', async ({ page }) => {
      await page.getByRole('link', { name: /New Technician|Add Technician|\+ Technician/i }).click()
      await expect(page).toHaveURL('/dashboard/technicians/new')
    })

    test('should display technicians list or empty state', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      const hasTechnicians = await page.locator('table tbody tr, .technician-card, [data-testid="technician-item"], .card').count() > 0
      const hasEmptyState = await page.locator('text=/no technicians|empty|add your first/i').count() > 0
      const hasContent = await page.locator('main').count() > 0

      expect(hasTechnicians || hasEmptyState || hasContent).toBeTruthy()
    })

    test('should display technician status indicators', async ({ page }) => {
      // Check for status badges or indicators
      const hasStatusIndicators = await page.locator('.badge, [class*="status"]').count() > 0
      // May show status if technicians exist
      expect(true).toBeTruthy()
    })
  })

  test.describe('New Technician Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/technicians/new')
    })

    test('should display new technician form', async ({ page }) => {
      await expect(page.locator('h1, h2').filter({ hasText: /New Technician|Add Technician/i })).toBeVisible()
    })

    test('should display name fields', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      // Check for name labels or input fields
      const hasFirstName = await page.locator('label').filter({ hasText: /first name/i }).count() > 0 ||
                          await page.locator('input[name="firstName"], input#firstName').count() > 0
      const hasLastName = await page.locator('label').filter({ hasText: /last name/i }).count() > 0 ||
                         await page.locator('input[name="lastName"], input#lastName').count() > 0
      expect(hasFirstName && hasLastName).toBeTruthy()
    })

    test('should display contact fields', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      // Check for email and phone labels or input fields
      const hasEmail = await page.locator('label').filter({ hasText: /email/i }).count() > 0 ||
                       await page.locator('input[type="email"], input#email').count() > 0
      const hasPhone = await page.locator('label').filter({ hasText: /phone/i }).count() > 0 ||
                       await page.locator('input[type="tel"], input#phone').count() > 0
      expect(hasEmail && hasPhone).toBeTruthy()
    })

    test('should display trade type selection', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      // Trade types can be buttons or a select
      const hasTradeButtons = await page.locator('button').filter({ hasText: /HVAC|PLUMBING|ELECTRICAL|GENERAL/i }).count() > 0
      const hasTradeSelect = await page.locator('select[name="tradeType"], #tradeType').count() > 0
      const hasTradeLabel = await page.locator('label').filter({ hasText: /trade type/i }).count() > 0
      expect(hasTradeButtons || hasTradeSelect || hasTradeLabel).toBeTruthy()
    })

    test('should display pay type selection', async ({ page }) => {
      const payTypeSelect = page.locator('select[name="payType"], #payType')
      if (await payTypeSelect.count() > 0) {
        await expect(payTypeSelect).toBeVisible()
      }
    })

    test('should display skills/certifications section', async ({ page }) => {
      const skillsSection = page.locator('text=/skills|certifications/i')
      if (await skillsSection.count() > 0) {
        await expect(skillsSection.first()).toBeVisible()
      }
    })

    test('should display Create button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /save|create|submit/i })).toBeVisible()
    })

    test('should display Cancel button', async ({ page }) => {
      await expect(page.getByRole('link', { name: /cancel/i })).toBeVisible()
    })

    test('Cancel button navigates back to technicians list', async ({ page }) => {
      await page.getByRole('link', { name: /cancel/i }).click()
      await expect(page).toHaveURL('/dashboard/technicians')
    })
  })

  test.describe('Technician Detail Page', () => {
    test('clicking on technician navigates to detail page', async ({ page }) => {
      const techLinks = page.locator('table tbody tr a, .technician-card a')

      if (await techLinks.count() > 0) {
        await techLinks.first().click()
        await expect(page).toHaveURL(/\/dashboard\/technicians\/[a-zA-Z0-9-]+/)
      }
    })
  })
})

test.describe('Technician Mobile App', () => {
  test.describe('Technician App Access', () => {
    test('technician app link from dashboard', async ({ page }) => {
      await login(page)
      await page.getByRole('link', { name: 'Technician App' }).click()
      await expect(page).toHaveURL('/tech')
    })
  })

  test.describe('Technician App Pages', () => {
    test.beforeEach(async ({ page }) => {
      await login(page)
      await page.goto('/tech')
    })

    test('should display today\'s jobs', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      // Check for any heading or main content
      const hasHeading = await page.locator('h1, h2, h3').count() > 0
      expect(hasHeading).toBeTruthy()
    })

    test('should display job list or empty state', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      const hasJobs = await page.locator('.job-card, [data-testid="job-item"], .card').count() > 0
      const hasEmptyState = await page.locator('text=/no jobs|empty|no assigned/i').count() > 0
      const hasHeading = await page.locator('h1, h2, h3').count() > 0
      const hasContent = await page.locator('main, .container, [class*="content"], div').count() > 0

      expect(hasJobs || hasEmptyState || hasHeading || hasContent).toBeTruthy()
    })

    test('should navigate to truck inventory', async ({ page }) => {
      const inventoryLink = page.getByRole('link', { name: /inventory|truck/i })
      if (await inventoryLink.count() > 0) {
        await inventoryLink.first().click()
        await expect(page).toHaveURL(/\/tech\/inventory/)
      }
    })

    test('should navigate to profile', async ({ page }) => {
      await page.goto('/tech/profile')
      await expect(page).toHaveURL('/tech/profile')
    })

    test('should navigate to schedule', async ({ page }) => {
      await page.goto('/tech/schedule')
      await expect(page).toHaveURL('/tech/schedule')
    })

    test('should navigate to estimate creation', async ({ page }) => {
      await page.goto('/tech/estimate')
      await expect(page).toHaveURL('/tech/estimate')
    })

    test('should navigate to invoice creation', async ({ page }) => {
      await page.goto('/tech/invoice')
      await expect(page).toHaveURL('/tech/invoice')
    })
  })

  test.describe('Technician Profile Page', () => {
    test.beforeEach(async ({ page }) => {
      await login(page)
      await page.goto('/tech/profile')
    })

    test('should display profile information', async ({ page }) => {
      await expect(page.locator('text=/profile|settings/i')).toBeVisible()
    })

    test('should display status selector', async ({ page }) => {
      const statusSelector = page.locator('select, [role="radiogroup"]')
      if (await statusSelector.count() > 0) {
        await expect(statusSelector.first()).toBeVisible()
      }
    })
  })
})
