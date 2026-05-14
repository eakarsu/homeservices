/**
 * Playwright Global Setup
 *
 * Runs once before all tests. Logs in as the admin user and saves the
 * authenticated browser storage state to `.auth/admin.json` so individual
 * tests can reuse it without repeating the login flow.
 *
 * Usage in playwright.config.ts:
 *   globalSetup: './tests/helpers/globalSetup.ts'
 *
 * Then in each spec or a project definition:
 *   use: { storageState: '.auth/admin.json' }
 */

import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const AUTH_DIR = path.join(process.cwd(), '.auth')
const AUTH_FILE = path.join(AUTH_DIR, 'admin.json')

export default async function globalSetup() {
  // Ensure the .auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true })
  }

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('you@example.com').fill('admin@comfortpro.com')
    await page.getByPlaceholder('Enter your password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Wait for successful login redirect
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 20_000 })

    // Save storage state (cookies + localStorage)
    await page.context().storageState({ path: AUTH_FILE })

    console.log('[globalSetup] Admin auth state saved to', AUTH_FILE)
  } catch (err) {
    // Non-fatal: some test environments won't have a running server
    console.warn('[globalSetup] Could not pre-authenticate:', err)
  } finally {
    await browser.close()
  }
}
