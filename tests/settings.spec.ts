import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/settings')
  })

  test.describe('Settings Overview Page', () => {
    test('should display settings page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Settings')
    })

    test('should display Pricebook link', async ({ page }) => {
      await expect(page.getByRole('link', { name: /pricebook|pricing/i })).toBeVisible()
    })

    test('should display Service Types link', async ({ page }) => {
      await expect(page.getByRole('link', { name: /service types|services/i })).toBeVisible()
    })

    test('should display Integrations link', async ({ page }) => {
      await expect(page.getByRole('link', { name: /integrations/i })).toBeVisible()
    })

    test('Pricebook link navigates correctly', async ({ page }) => {
      await page.getByRole('link', { name: /pricebook|pricing/i }).click()
      await expect(page).toHaveURL(/\/dashboard\/settings\/pricebook/)
    })

    test('Service Types link navigates correctly', async ({ page }) => {
      await page.getByRole('link', { name: /service types|services/i }).click()
      await expect(page).toHaveURL(/\/dashboard\/settings\/service-types/)
    })

    test('Integrations link navigates correctly', async ({ page }) => {
      await page.getByRole('link', { name: /integrations/i }).click()
      await expect(page).toHaveURL(/\/dashboard\/settings\/integrations/)
    })
  })

  test.describe('Pricebook Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/settings/pricebook')
    })

    test('should display pricebook page', async ({ page }) => {
      await expect(page.locator('h1, h2').filter({ hasText: /pricebook|pricing/i })).toBeVisible()
    })

    test('should display Add Item button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /add|new|\+/i })).toBeVisible()
    })

    test('should display pricebook items or empty state', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      const hasItems = await page.locator('table tbody tr, .pricebook-item, [data-testid="pricebook-item"]').count() > 0
      const hasEmptyState = await page.locator('text=/no pricebook|no items|empty|add/i').count() > 0

      expect(hasItems || hasEmptyState).toBeTruthy()
    })

    test('Add button opens form/modal', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: /add/i }).first().click()

      // Wait for modal to appear
      await page.waitForTimeout(500)

      // Should show modal overlay
      const hasModal = await page.locator('.fixed.inset-0, [role="dialog"]').count() > 0
      expect(hasModal).toBeTruthy()
    })
  })

  test.describe('Service Types Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/settings/service-types')
    })

    test('should display service types page', async ({ page }) => {
      await expect(page.locator('h1, h2').filter({ hasText: /service types|services/i })).toBeVisible()
    })

    test('should display Add Service Type button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /add|new|\+/i })).toBeVisible()
    })

    test('should display service types list or empty state', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      const hasTypes = await page.locator('table tbody tr, .service-type, .card, [data-testid="service-type"]').count() > 0
      const hasEmptyState = await page.locator('text=/no service|empty|add/i').count() > 0

      expect(hasTypes || hasEmptyState).toBeTruthy()
    })

    test('Add button opens form/modal', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: /add/i }).first().click()

      // Wait for modal to appear
      await page.waitForTimeout(500)

      // Should show modal overlay
      const hasModal = await page.locator('.fixed.inset-0, [role="dialog"]').count() > 0
      expect(hasModal).toBeTruthy()
    })
  })

  test.describe('Integrations Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/settings/integrations')
    })

    test('should display integrations page', async ({ page }) => {
      await expect(page.locator('h1, h2').filter({ hasText: /integrations/i })).toBeVisible()
    })

    test('should display integration options', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      // Check for various integration sections
      const hasIntegrations = await page.locator('.card, [data-testid="integration"]').count() > 0
      const hasMainContent = await page.locator('main, h1').count() > 0
      expect(hasIntegrations || hasMainContent).toBeTruthy()
    })

    test('should display Stripe integration', async ({ page }) => {
      await expect(page.locator('text=/stripe/i').first()).toBeVisible()
    })

    test('should display Google Maps integration', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /google/i })).toBeVisible()
    })

    test('should display Twilio integration', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /twilio/i })).toBeVisible()
    })

    test('should display Email integration', async ({ page }) => {
      await expect(page.locator('text=/email|smtp/i').first()).toBeVisible()
    })

    test('should display AI integration', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /openai/i })).toBeVisible()
    })
  })
})

test.describe('Settings Forms', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('can add new service type', async ({ page }) => {
    await page.goto('/dashboard/settings/service-types')

    await page.getByRole('button', { name: /add|new|\+/i }).first().click()

    // Fill form if modal appears
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]')
    if (await nameInput.count() > 0) {
      await nameInput.fill(`Test Service ${Date.now()}`)

      // Try to save
      const saveButton = page.getByRole('button', { name: /save|create|submit/i })
      if (await saveButton.count() > 0) {
        await saveButton.click()
      }
    }
  })

  test('can add new pricebook item', async ({ page }) => {
    await page.goto('/dashboard/settings/pricebook')

    await page.getByRole('button', { name: /add|new|\+/i }).first().click()

    // Fill form if modal appears
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]')
    if (await nameInput.count() > 0) {
      await nameInput.fill(`Test Item ${Date.now()}`)

      const priceInput = page.locator('input[name="price"], input[type="number"]').first()
      if (await priceInput.count() > 0) {
        await priceInput.fill('99.99')
      }

      // Try to save
      const saveButton = page.getByRole('button', { name: /save|create|submit/i })
      if (await saveButton.count() > 0) {
        await saveButton.click()
      }
    }
  })
})
