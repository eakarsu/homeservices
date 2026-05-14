/**
 * Shared test data constants and factory helpers for Playwright specs.
 * Import from individual spec files to keep tests DRY.
 */

export const TEST_CREDENTIALS = {
  admin: { email: 'admin@comfortpro.com', password: 'password123' },
  dispatcher: { email: 'sarah@comfortpro.com', password: 'password123' },
  technician: { email: 'tom@comfortpro.com', password: 'password123' },
}

export const TEST_URLS = {
  dashboard: '/dashboard',
  jobs: '/dashboard/jobs',
  newJob: '/dashboard/jobs/new',
  customers: '/dashboard/customers',
  technicians: '/dashboard/technicians',
  dispatch: '/dashboard/dispatch',
  estimates: '/dashboard/estimates',
  invoices: '/dashboard/invoices',
  inventory: '/dashboard/inventory',
  settings: '/dashboard/settings',
}

/** Returns a unique job title for a test run to avoid collisions */
export function uniqueJobTitle(prefix = 'Test Job') {
  return `${prefix} ${Date.now()}`
}

/** Returns a unique customer name for a test run */
export function uniqueCustomerName(prefix = 'Test Customer') {
  return `${prefix} ${Date.now()}`
}
