import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Authentication', () => {
  test.describe('Landing Page', () => {
    test('should display landing page with login/signup buttons', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('link', { name: 'Sign In' }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: /start free/i }).first()).toBeVisible()
    })

    test('should navigate to login page', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('link', { name: 'Sign In' }).first().click()
      await expect(page).toHaveURL('/login')
    })

    test('should navigate to register page', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('link', { name: /start free/i }).first().click()
      await expect(page).toHaveURL('/register')
    })
  })

  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login')
    })

    test('should display login form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /home services ai/i })).toBeVisible()
      await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
      await expect(page.getByPlaceholder('Enter your password')).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })

    test('should display demo credentials', async ({ page }) => {
      await expect(page.locator('text=Demo Credentials')).toBeVisible()
      await expect(page.locator('text=admin@comfortpro.com')).toBeVisible()
    })

    test('should show link to register page', async ({ page }) => {
      await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible()
    })

    test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
      await page.getByPlaceholder('you@example.com').fill('admin@comfortpro.com')
      await page.getByPlaceholder('Enter your password').fill('password123')
      await page.getByRole('button', { name: /sign in/i }).click()
      await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
    })

    test('should show error with invalid credentials', async ({ page }) => {
      await page.getByPlaceholder('you@example.com').fill('wrong@email.com')
      await page.getByPlaceholder('Enter your password').fill('wrongpassword')
      await page.getByRole('button', { name: /sign in/i }).click()
      await expect(page.locator('text=/invalid|error/i')).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Register Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register')
    })

    test('should display register form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()
    })

    test('should have link to login page', async ({ page }) => {
      await expect(page.getByRole('link', { name: /sign in|login/i })).toBeVisible()
    })
  })

  test.describe('Logout', () => {
    test('should logout from dashboard', async ({ page }) => {
      await login(page)

      const signOutButton = page.getByRole('button', { name: /sign out|logout/i })
      if (await signOutButton.count() > 0) {
        await signOutButton.click()
        await expect(page).toHaveURL('/login')
      }
    })
  })
})
