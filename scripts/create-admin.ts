import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = (process.env.ADMIN_EMAIL || process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD || ''
  const companyName = process.env.BOOTSTRAP_TENANT_NAME || 'Runtime Acceptance Company'
  if (!email || !email.includes('@')) throw new Error('ADMIN_EMAIL is required')
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must contain at least 12 characters')

  const companyEmail = `runtime-${Buffer.from(companyName).toString('hex').slice(0, 24)}@example.invalid`
  let company = await prisma.company.findFirst({ where: { email: companyEmail } })
  if (!company) {
    company = await prisma.company.create({
      data: { name: companyName, email: companyEmail, serviceArea: [] },
    })
  }
  const passwordHash = await hash(password, 12)
  await prisma.user.upsert({
    where: { email },
    create: {
      email, password: passwordHash, firstName: 'Runtime', lastName: 'Administrator',
      role: 'ADMIN', companyId: company.id, isActive: true, emailVerified: true,
    },
    update: {
      password: passwordHash, firstName: 'Runtime', lastName: 'Administrator',
      role: 'ADMIN', companyId: company.id, isActive: true, emailVerified: true,
    },
  })
  console.log(`Provisioned administrator ${email}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
