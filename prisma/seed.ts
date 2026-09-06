import { PrismaClient } from '@prisma/client'
import { loadEnvConfig } from '@next/env'
import { loadDemoData } from '../src/lib/seedDemoData'

loadEnvConfig(process.cwd())
const prisma = new PrismaClient()
async function main() {
  const database = new URL(process.env.DATABASE_URL || '')
  if (!['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)) throw new Error('The demo loader only targets the configured local database')
  if (process.env.NODE_ENV === 'production') throw new Error('Demo loading is disabled in production')
  const email = process.env.DEMO_DATA_ADMIN_EMAIL || process.env.ADMIN_EMAIL || process.env.BOOTSTRAP_ADMIN_EMAIL || ''
  if (!email) throw new Error('Set ADMIN_EMAIL or DEMO_DATA_ADMIN_EMAIL to the existing demo administrator')
  const summary = await loadDemoData(prisma, email)
  console.log('Demo dataset ready in the existing administrator company. Existing records were preserved.')
  console.log(JSON.stringify(summary, null, 2))
}
main().catch(error => { console.error(error.message); process.exitCode = 1 }).finally(() => prisma.$disconnect())
