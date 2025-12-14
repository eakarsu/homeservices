import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test.describe('Layout', () => {
    test('should display sidebar', async ({ page }) => {
      await expect(page.locator('aside')).toBeVisible()
    })

    test('should display logo in sidebar', async ({ page }) => {
      await expect(page.locator('aside').locator('text=HomeServ AI')).toBeVisible()
    })

    test('should display user info in sidebar', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible()
    })
  })

  test.describe('Sidebar Navigation', () => {
    test('Dashboard link is active and navigates correctly', async ({ page }) => {
      await page.getByRole('link', { name: 'Dashboard' }).click()
      await expect(page).toHaveURL('/dashboard')
    })

    test('Customers link navigates to customers page', async ({ page }) => {
      await page.getByRole('link', { name: 'Customers' }).click()
      await expect(page).toHaveURL('/dashboard/customers')
    })

    test('Jobs link navigates to jobs page', async ({ page }) => {
      await page.getByRole('link', { name: 'Jobs' }).click()
      await expect(page).toHaveURL('/dashboard/jobs')
    })

    test('Dispatch link navigates to dispatch page', async ({ page }) => {
      await page.getByRole('link', { name: 'Dispatch' }).click()
      await expect(page).toHaveURL('/dashboard/dispatch')
    })

    test('Schedule link navigates to schedule page', async ({ page }) => {
      await page.getByRole('link', { name: 'Schedule' }).click()
      await expect(page).toHaveURL('/dashboard/schedule')
    })

    test('Estimates link navigates to estimates page', async ({ page }) => {
      await page.getByRole('link', { name: 'Estimates' }).click()
      await expect(page).toHaveURL('/dashboard/estimates')
    })

    test('Invoices link navigates to invoices page', async ({ page }) => {
      await page.getByRole('link', { name: 'Invoices' }).click()
      await expect(page).toHaveURL('/dashboard/invoices')
    })

    test('Inventory link navigates to inventory page', async ({ page }) => {
      await page.getByRole('link', { name: 'Inventory' }).click()
      await expect(page).toHaveURL('/dashboard/inventory')
    })

    test('Agreements link navigates to agreements page', async ({ page }) => {
      await page.getByRole('link', { name: 'Agreements' }).click()
      await expect(page).toHaveURL('/dashboard/agreements')
    })

    test('Technicians link navigates to technicians page', async ({ page }) => {
      await page.getByRole('link', { name: 'Technicians' }).click()
      await expect(page).toHaveURL('/dashboard/technicians')
    })

    test('Reports link navigates to reports page', async ({ page }) => {
      await page.getByRole('link', { name: 'Reports' }).click()
      await expect(page).toHaveURL('/dashboard/reports')
    })

    test('AI Features link navigates to AI page', async ({ page }) => {
      await page.getByRole('link', { name: 'AI Features' }).click()
      await expect(page).toHaveURL('/dashboard/ai')
    })

    test('Settings link navigates to settings page', async ({ page }) => {
      await page.getByRole('link', { name: 'Settings' }).click()
      await expect(page).toHaveURL('/dashboard/settings')
    })

    test('Technician App link navigates to tech app', async ({ page }) => {
      await page.getByRole('link', { name: 'Technician App' }).click()
      await expect(page).toHaveURL('/tech')
    })
  })

  test.describe('Dashboard Content', () => {
    test('should display dashboard title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Dashboard')
    })

    test('should display New Job button', async ({ page }) => {
      await expect(page.getByRole('link', { name: '+ New Job' })).toBeVisible()
    })

    test('New Job button navigates to new job page', async ({ page }) => {
      await page.getByRole('link', { name: '+ New Job' }).click()
      await expect(page).toHaveURL('/dashboard/jobs/new')
    })

    test('should display stat cards', async ({ page }) => {
      await expect(page.locator('text=Today\'s Jobs')).toBeVisible()
      await expect(page.locator('text=Pending Jobs')).toBeVisible()
      await expect(page.locator('text=Completed Today')).toBeVisible()
      await expect(page.locator('text=Techs Available')).toBeVisible()
    })

    test('should display revenue overview section', async ({ page }) => {
      await expect(page.locator('text=Revenue Overview')).toBeVisible()
      await expect(page.getByText('Today', { exact: true })).toBeVisible()
      await expect(page.locator('text=This Week')).toBeVisible()
      await expect(page.locator('text=This Month')).toBeVisible()
    })

    test('should display recent jobs section', async ({ page }) => {
      await expect(page.locator('text=Recent Jobs')).toBeVisible()
      await expect(page.getByRole('link', { name: 'View All' }).first()).toBeVisible()
    })

    test('View All jobs link navigates to jobs page', async ({ page }) => {
      await page.getByRole('link', { name: 'View All' }).first().click()
      await expect(page).toHaveURL('/dashboard/jobs')
    })

    test('should display alerts section', async ({ page }) => {
      await expect(page.locator('text=Alerts & Actions')).toBeVisible()
      await expect(page.locator('text=Open Estimates')).toBeVisible()
      await expect(page.locator('text=Overdue Invoices')).toBeVisible()
      await expect(page.locator('text=Expiring Agreements')).toBeVisible()
    })

    test('should display quick actions section', async ({ page }) => {
      await expect(page.locator('text=Quick Actions')).toBeVisible()
    })

    test('Quick Action: New Job navigates correctly', async ({ page }) => {
      await page.locator('.card').filter({ hasText: 'Quick Actions' }).getByRole('link', { name: 'New Job' }).click()
      await expect(page).toHaveURL('/dashboard/jobs/new')
    })

    test('Quick Action: New Customer navigates correctly', async ({ page }) => {
      await page.locator('.card').filter({ hasText: 'Quick Actions' }).getByRole('link', { name: 'New Customer' }).click()
      await expect(page).toHaveURL('/dashboard/customers/new')
    })

    test('Quick Action: New Estimate navigates correctly', async ({ page }) => {
      await page.locator('.card').filter({ hasText: 'Quick Actions' }).getByRole('link', { name: 'New Estimate' }).click()
      await expect(page).toHaveURL('/dashboard/estimates/new')
    })

    test('Quick Action: Dispatch Board navigates correctly', async ({ page }) => {
      await page.locator('.card').filter({ hasText: 'Quick Actions' }).getByRole('link', { name: 'Dispatch Board' }).click()
      await expect(page).toHaveURL('/dashboard/dispatch')
    })
  })

  test.describe('Stat Card Navigation', () => {
    test('Today\'s Jobs card navigates to filtered jobs', async ({ page }) => {
      await page.locator('.stat-card').filter({ hasText: 'Today\'s Jobs' }).click()
      await expect(page).toHaveURL(/\/dashboard\/jobs/)
    })

    test('Pending Jobs card navigates to filtered jobs', async ({ page }) => {
      await page.locator('.stat-card').filter({ hasText: 'Pending Jobs' }).click()
      await expect(page).toHaveURL(/\/dashboard\/jobs/)
    })

    test('Techs Available card navigates to technicians', async ({ page }) => {
      await page.locator('.stat-card').filter({ hasText: 'Techs Available' }).click()
      await expect(page).toHaveURL('/dashboard/technicians')
    })
  })

  test.describe('Alert Card Navigation', () => {
    test('Open Estimates alert navigates to estimates', async ({ page }) => {
      await page.locator('a').filter({ hasText: 'Open Estimates' }).click()
      await expect(page).toHaveURL(/\/dashboard\/estimates/)
    })

    test('Overdue Invoices alert navigates to invoices', async ({ page }) => {
      await page.locator('a').filter({ hasText: 'Overdue Invoices' }).click()
      await expect(page).toHaveURL(/\/dashboard\/invoices/)
    })

    test('Expiring Agreements alert navigates to agreements', async ({ page }) => {
      await page.locator('a').filter({ hasText: 'Expiring Agreements' }).click()
      await expect(page).toHaveURL(/\/dashboard\/agreements/)
    })
  })
})
