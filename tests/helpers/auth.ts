import { Page, expect } from '@playwright/test'

export async function login(page: Page, email = 'admin@comfortpro.com', password = 'password123') {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // Fill email using placeholder
  await page.getByPlaceholder('you@example.com').fill(email)

  // Fill password using placeholder
  await page.getByPlaceholder('Enter your password').fill(password)

  // Click sign in
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard', { timeout: 15000 })
}

export async function loginAsDispatcher(page: Page) {
  await login(page, 'sarah@comfortpro.com', 'password123')
}

export async function loginAsTechnician(page: Page) {
  await login(page, 'tom@comfortpro.com', 'password123')
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Sign Out' }).click()
  await page.waitForURL('/login')
}
