import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Navigation', () => {
    test('should display navigation bar', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible()
      await expect(page.locator('text=FieldService AI').first()).toBeVisible()
    })

    test('Features link scrolls to features section', async ({ page }) => {
      await page.getByRole('link', { name: 'Features' }).first().click()
      await expect(page).toHaveURL(/#features/)
    })

    test('Pricing link scrolls to pricing section', async ({ page }) => {
      await page.getByRole('link', { name: 'Pricing' }).first().click()
      await expect(page).toHaveURL(/#pricing/)
    })

    test('Compare link scrolls to comparison section', async ({ page }) => {
      await page.getByRole('link', { name: 'Compare' }).first().click()
      await expect(page).toHaveURL(/#comparison/)
    })

    test('Sign In link navigates to login', async ({ page }) => {
      await page.getByRole('link', { name: 'Sign In' }).first().click()
      await expect(page).toHaveURL('/login')
    })

    test('Start Free Trial link navigates to register', async ({ page }) => {
      await page.getByRole('link', { name: 'Start Free Trial' }).first().click()
      await expect(page).toHaveURL('/register')
    })
  })

  test.describe('Hero Section', () => {
    test('should display main headline', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('text=/ServiceTitan|Features/i').first()).toBeVisible()
    })

    test('should display AI badge', async ({ page }) => {
      await expect(page.locator('text=AI-Powered').first()).toBeVisible()
    })

    test('should display hero stats', async ({ page }) => {
      await expect(page.locator('text=$99').first()).toBeVisible()
      await expect(page.locator('text=$0').first()).toBeVisible()
      await expect(page.locator('text=90%').first()).toBeVisible()
    })

    test('should display CTA buttons', async ({ page }) => {
      await expect(page.getByRole('link', { name: /start free 14-day trial/i }).first()).toBeVisible()
    })

    test('Sign in to your account link navigates to login', async ({ page }) => {
      await page.getByRole('link', { name: /sign in to your account/i }).first().click()
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Problem Section', () => {
    test('should display pain points heading', async ({ page }) => {
      await expect(page.locator('text=/tired of overpaying/i')).toBeVisible()
    })

    test('should display competitor pricing pain points', async ({ page }) => {
      await expect(page.locator('text=$500').first()).toBeVisible()
      await expect(page.locator('text=12-24 months').first()).toBeVisible()
    })
  })

  test.describe('Features Section', () => {
    test('should display features heading', async ({ page }) => {
      await expect(page.locator('text=Everything You Need').first()).toBeVisible()
    })

    test('should display all 6 feature cards', async ({ page }) => {
      await expect(page.locator('text=AI-Powered Dispatch').first()).toBeVisible()
      await expect(page.locator('text=Smart Scheduling').first()).toBeVisible()
      await expect(page.locator('text=Estimates & Invoicing').first()).toBeVisible()
      await expect(page.locator('text=Mobile App for Techs').first()).toBeVisible()
      await expect(page.locator('text=Real-Time Dashboard').first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'AI Diagnostics' })).toBeVisible()
    })
  })

  test.describe('Pricing Section', () => {
    test('should display pricing heading', async ({ page }) => {
      await expect(page.locator('text=Simple, Transparent Pricing')).toBeVisible()
    })

    test('should display all pricing tiers', async ({ page }) => {
      await expect(page.locator('text=Free').first()).toBeVisible()
      await expect(page.locator('text=Pro').first()).toBeVisible()
      await expect(page.locator('text=Business').first()).toBeVisible()
    })

    test('should display Pro tier as most popular', async ({ page }) => {
      await expect(page.locator('text=Most Popular')).toBeVisible()
    })

    test('should display tier prices', async ({ page }) => {
      await expect(page.locator('text=$0/mo').first()).toBeVisible()
      await expect(page.locator('text=$99/mo').first()).toBeVisible()
      await expect(page.locator('text=$249/mo').first()).toBeVisible()
    })

    test('Free tier Start Free button navigates to register', async ({ page }) => {
      await page.getByRole('link', { name: 'Start Free', exact: true }).click()
      await expect(page).toHaveURL('/register')
    })
  })

  test.describe('Comparison Section', () => {
    test('should display comparison heading', async ({ page }) => {
      await expect(page.locator('text=See How We Compare')).toBeVisible()
    })

    test('should display comparison table', async ({ page }) => {
      await expect(page.getByRole('table')).toBeVisible()
    })

    test('should display comparison features', async ({ page }) => {
      await expect(page.getByRole('cell', { name: 'Starting Price' })).toBeVisible()
      await expect(page.getByRole('cell', { name: 'Per-Technician Fee' })).toBeVisible()
      await expect(page.getByRole('cell', { name: 'Contract Required' })).toBeVisible()
    })

    test('should display competitor names', async ({ page }) => {
      await expect(page.getByRole('columnheader', { name: 'ServiceTitan' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Housecall Pro' })).toBeVisible()
    })
  })

  test.describe('CTA Section', () => {
    test('should display CTA heading', async ({ page }) => {
      await expect(page.locator('text=Ready to Stop Overpaying?')).toBeVisible()
    })

    test('should display final CTA button', async ({ page }) => {
      const ctaButtons = page.getByRole('link', { name: /start free 14-day trial/i })
      await expect(ctaButtons.last()).toBeVisible()
    })
  })

  test.describe('Footer', () => {
    test('should display footer', async ({ page }) => {
      await expect(page.locator('footer, [role="contentinfo"]')).toBeVisible()
    })

    test('should display company name in footer', async ({ page }) => {
      await expect(page.locator('text=© 2025 FieldService AI')).toBeVisible()
    })

    test('should display footer links', async ({ page }) => {
      await expect(page.locator('footer').getByRole('link', { name: 'Features' })).toBeVisible()
      await expect(page.locator('footer').getByRole('link', { name: 'Pricing' })).toBeVisible()
    })
  })
})
