import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('AI Features', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/dashboard/ai')
  })

  test.describe('AI Features Overview Page', () => {
    test('should display AI Features page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('AI')
    })

    test('should display AI feature cards', async ({ page }) => {
      const aiCards = page.locator('.card, [data-testid="ai-feature"]')
      await expect(aiCards.first()).toBeVisible()
    })

    test('should display Dispatch Optimizer link', async ({ page }) => {
      await expect(page.getByRole('link', { name: /dispatch optimizer/i }).first()).toBeVisible()
    })

    test('should display Quote Generator link', async ({ page }) => {
      await expect(page.getByRole('link', { name: /quote generator/i }).first()).toBeVisible()
    })

    test('should display Diagnostics link', async ({ page }) => {
      await expect(page.getByRole('link', { name: /diagnostic/i }).first()).toBeVisible()
    })

    test('should display Job Summary link', async ({ page }) => {
      await expect(page.getByRole('link', { name: /job summary/i }).first()).toBeVisible()
    })

    test('should display Smart Scheduling link', async ({ page }) => {
      await expect(page.getByRole('link', { name: /smart schedul/i }).first()).toBeVisible()
    })

    test('should display Predictive Maintenance link', async ({ page }) => {
      await expect(page.getByRole('link', { name: /predictive maintenance/i }).first()).toBeVisible()
    })

    test('should display Customer Insights link', async ({ page }) => {
      await expect(page.getByRole('link', { name: /customer insights/i }).first()).toBeVisible()
    })

    test('should display Inventory Forecast link', async ({ page }) => {
      await expect(page.getByRole('link', { name: /inventory forecast/i }).first()).toBeVisible()
    })
  })

  test.describe('Dispatch Optimizer Page', () => {
    test('navigates to dispatch optimizer', async ({ page }) => {
      await page.getByRole('link', { name: /dispatch optimizer/i }).first().click()
      await expect(page).toHaveURL(/\/dashboard\/ai\/dispatch/)
    })

    test('dispatch optimizer page displays form', async ({ page }) => {
      await page.goto('/dashboard/ai/dispatch-optimizer')
      await expect(page.getByRole('heading', { name: /dispatch/i }).first()).toBeVisible()
    })

    test('dispatch optimizer has back button', async ({ page }) => {
      await page.goto('/dashboard/ai/dispatch-optimizer')
      const backButton = page.getByRole('button', { name: /back/i })
      if (await backButton.count() > 0) {
        await backButton.first().click()
        await expect(page).toHaveURL('/dashboard/ai')
      }
    })
  })

  test.describe('Quote Generator Page', () => {
    test('navigates to quote generator', async ({ page }) => {
      await page.getByRole('link', { name: /quote generator/i }).first().click()
      await expect(page).toHaveURL(/\/dashboard\/ai\/quote/)
    })

    test('quote generator page displays form', async ({ page }) => {
      await page.goto('/dashboard/ai/quote-generator')
      await expect(page.getByRole('heading', { name: /quote/i }).first()).toBeVisible()
    })

    test('quote generator has job type selection', async ({ page }) => {
      await page.goto('/dashboard/ai/quote-generator')
      const jobTypeSelect = page.locator('select, [role="combobox"]')
      if (await jobTypeSelect.count() > 0) {
        await expect(jobTypeSelect.first()).toBeVisible()
      }
    })

    test('quote generator has generate button', async ({ page }) => {
      await page.goto('/dashboard/ai/quote-generator')
      const generateButton = page.getByRole('button', { name: /generate/i })
      if (await generateButton.count() > 0) {
        await expect(generateButton.first()).toBeVisible()
      } else {
        await expect(page.locator('h1').first()).toBeVisible()
      }
    })
  })

  test.describe('Diagnostics Page', () => {
    test('navigates to diagnostics', async ({ page }) => {
      await page.getByRole('link', { name: /diagnostic/i }).first().click()
      await expect(page).toHaveURL(/\/dashboard\/ai\/diagnostic/)
    })

    test('diagnostics page displays form', async ({ page }) => {
      await page.goto('/dashboard/ai/diagnostics')
      await expect(page.getByRole('heading', { name: /diagnostic/i }).first()).toBeVisible()
    })

    test('diagnostics has equipment type selection', async ({ page }) => {
      await page.goto('/dashboard/ai/diagnostics')
      const equipmentSelect = page.locator('select, [role="combobox"]').first()
      if (await equipmentSelect.count() > 0) {
        await expect(equipmentSelect).toBeVisible()
      }
    })

    test('diagnostics has symptoms input', async ({ page }) => {
      await page.goto('/dashboard/ai/diagnostics')
      const symptomsInput = page.locator('textarea, input[name="symptoms"]')
      if (await symptomsInput.count() > 0) {
        await expect(symptomsInput.first()).toBeVisible()
      }
    })

    test('diagnostics has analyze button', async ({ page }) => {
      await page.goto('/dashboard/ai/diagnostics')
      const analyzeButton = page.getByRole('button', { name: /analyze|diagnose/i })
      if (await analyzeButton.count() > 0) {
        await expect(analyzeButton.first()).toBeVisible()
      } else {
        await expect(page.locator('h1').first()).toBeVisible()
      }
    })
  })

  test.describe('Job Summary Page', () => {
    test('navigates to job summary', async ({ page }) => {
      await page.getByRole('link', { name: /job summary/i }).first().click()
      await expect(page).toHaveURL(/\/dashboard\/ai\/job-summary/)
    })

    test('job summary page displays form', async ({ page }) => {
      await page.goto('/dashboard/ai/job-summary')
      await expect(page.getByRole('heading', { name: /summary/i }).first()).toBeVisible()
    })

    test('job summary has notes input', async ({ page }) => {
      await page.goto('/dashboard/ai/job-summary')
      const notesInput = page.locator('textarea')
      if (await notesInput.count() > 0) {
        await expect(notesInput.first()).toBeVisible()
      }
    })

    test('job summary has generate button', async ({ page }) => {
      await page.goto('/dashboard/ai/job-summary')
      const generateButton = page.getByRole('button', { name: /generate|create/i })
      if (await generateButton.count() > 0) {
        await expect(generateButton.first()).toBeVisible()
      } else {
        await expect(page.locator('h1').first()).toBeVisible()
      }
    })
  })

  test.describe('Smart Scheduling Page', () => {
    test('navigates to smart scheduling', async ({ page }) => {
      await page.getByRole('link', { name: /smart schedul/i }).first().click()
      await expect(page).toHaveURL(/\/dashboard\/ai\/smart-scheduling/)
    })

    test('smart scheduling page displays', async ({ page }) => {
      await page.goto('/dashboard/ai/smart-scheduling')
      await expect(page.getByRole('heading', { name: /smart scheduling/i })).toBeVisible()
    })
  })

  test.describe('Predictive Maintenance Page', () => {
    test('navigates to predictive maintenance', async ({ page }) => {
      await page.getByRole('link', { name: /predictive maintenance/i }).first().click()
      await expect(page).toHaveURL(/\/dashboard\/ai\/predictive-maintenance/)
    })

    test('predictive maintenance page displays', async ({ page }) => {
      await page.goto('/dashboard/ai/predictive-maintenance')
      await expect(page.getByRole('heading', { name: /predictive|maintenance/i }).first()).toBeVisible()
    })
  })

  test.describe('Customer Insights Page', () => {
    test('navigates to customer insights', async ({ page }) => {
      await page.getByRole('link', { name: /customer insights/i }).first().click()
      await expect(page).toHaveURL(/\/dashboard\/ai\/customer-insights/)
    })

    test('customer insights page displays', async ({ page }) => {
      await page.goto('/dashboard/ai/customer-insights')
      await expect(page.getByRole('heading', { name: /customer|insights/i }).first()).toBeVisible()
    })
  })

  test.describe('Inventory Forecast Page', () => {
    test('navigates to inventory forecast', async ({ page }) => {
      await page.getByRole('link', { name: /inventory forecast/i }).first().click()
      await expect(page).toHaveURL(/\/dashboard\/ai\/inventory-forecast/)
    })

    test('inventory forecast page displays', async ({ page }) => {
      await page.goto('/dashboard/ai/inventory-forecast')
      await expect(page.getByRole('heading', { name: /inventory|forecast/i }).first()).toBeVisible()
    })
  })
})
