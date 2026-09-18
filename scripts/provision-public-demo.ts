import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'node:crypto'
import { hash } from 'bcryptjs'
import { publicDemoConfig } from '../src/lib/public-demo'
import { seedDemoDataForCompany } from '../src/lib/seedDemoData'

const prisma = new PrismaClient()
async function main() {
  const demo = publicDemoConfig()
  if (!demo || process.env.CONFIRM_PUBLIC_DEMO_SETUP !== 'true') throw new Error('Explicit public demo configuration and CONFIRM_PUBLIC_DEMO_SETUP=true are required')
  // This loader can only populate the dedicated sample company.
  const name = 'ServiceCrew Public Demo — fictional sample data'
  const ownerId = `${demo.companyId}-seed-owner`
  process.env.DEMO_PASSWORD = randomBytes(32).toString('hex')
  const ownerPassword = await hash(randomBytes(32).toString('hex'),12)
  const demoPassword = await hash(demo.password,12)
  await prisma.$transaction(async tx => {
    const existing = await tx.company.findUnique({where:{id:demo.companyId}})
    if (existing && existing.name !== name) throw new Error('Refusing to seed an existing business company')
    const account = await tx.user.findUnique({where:{email:demo.email}})
    if (account && (account.companyId !== demo.companyId || account.role !== 'OFFICE')) throw new Error('Refusing to repurpose an existing account')
    await tx.company.upsert({where:{id:demo.companyId},update:{},create:{id:demo.companyId,name,timezone:'America/New_York',serviceArea:[]}})
    await tx.user.upsert({where:{id:ownerId},update:{isActive:false},create:{id:ownerId,companyId:demo.companyId,email:`${ownerId}@example.invalid`,password:ownerPassword,firstName:'Sample',lastName:'Data Owner',role:'ADMIN',isActive:false,emailVerified:true}})
    await seedDemoDataForCompany(tx,demo.companyId,ownerId)
    await tx.user.upsert({where:{email:demo.email},update:{password:demoPassword,isActive:true,emailVerified:true},create:{companyId:demo.companyId,email:demo.email,password:demoPassword,firstName:'Public',lastName:'Demo',role:'OFFICE',isActive:true,emailVerified:true}})
  },{timeout:120000})
  console.log('Public demo account and fictional sample company are ready.')
}
main().catch(error=>{console.error(error.message);process.exitCode=1}).finally(()=>prisma.$disconnect())
