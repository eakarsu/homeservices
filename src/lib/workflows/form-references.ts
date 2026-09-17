import { prisma } from '@/lib/prisma'
import type { AuthContext } from '@/lib/operations-governance'
import { fail } from './core'
import { matchWorkspaceRecords, matchNamedRecord } from '@/lib/workspace-selection'
import type { AIField, FormValues } from '@/lib/form-ai'

export async function resolveFormReferences(user: AuthContext, fields: AIField[], values: FormValues, source: string, selected: {jobId:string;customerId:string}) {
  const keys = new Set(fields.map(f => f.key)), resolved: FormValues = {}
  const usesCustomer = keys.has('customerId') || keys.has('propertyId')
  const [customers,jobs] = await Promise.all([
    usesCustomer ? prisma.customer.findMany({where:{companyId:user.companyId},select:{id:true,firstName:true,lastName:true,companyName:true},take:1000}) : [],
    keys.has('jobId') ? prisma.job.findMany({where:{companyId:user.companyId},select:{id:true,jobNumber:true,title:true,customerId:true},orderBy:{createdAt:'desc'},take:500}) : [],
  ])
  const choice = matchWorkspaceRecords(source,jobs,customers,selected)
  if (choice.customerId && usesCustomer && !customers.some(c => c.id === choice.customerId)) fail('Customer is not available for this form',403)
  if (choice.jobId && keys.has('jobId') && !jobs.some(j => j.id === choice.jobId)) fail('Job is not available for this form',403)
  if (keys.has('customerId') && choice.customerId) resolved.customerId = choice.customerId
  if (keys.has('jobId') && choice.jobId) resolved.jobId = choice.jobId
  const named: Record<string,{id:string;name:string}[]> = {}
  if (keys.has('propertyId')) named.propertyId = choice.customerId ? (await prisma.property.findMany({where:{customerId:choice.customerId,customer:{companyId:user.companyId}},select:{id:true,address:true}})).map(p => ({id:p.id,name:p.address})) : []
  if (keys.has('serviceTypeId')) named.serviceTypeId = await prisma.serviceType.findMany({where:{companyId:user.companyId,isActive:true},select:{id:true,name:true}})
  if (keys.has('planId')) named.planId = await prisma.agreementPlan.findMany({where:{companyId:user.companyId,isActive:true},select:{id:true,name:true}})
  if (keys.has('truckId')) named.truckId = await prisma.truck.findMany({where:{companyId:user.companyId,isActive:true},select:{id:true,name:true}})
  for (const [key,rows] of Object.entries(named)) {
    const current = typeof values[key] === 'string' ? String(values[key]) : ''
    if (current && !rows.some(r => r.id === current)) fail(`Selected ${key.replace('Id','')} is not available for this customer or company`,403)
    const id = current || matchNamedRecord(source,rows) || (key === 'propertyId' && rows.length === 1 ? rows[0].id : '')
    if (id) resolved[key] = id
  }
  const referenceKeys = new Set(['customerId','jobId',...Object.keys(named)])
  return {selection:choice,resolved,fields:fields.map(f => referenceKeys.has(f.key) ? {...f,options:resolved[f.key] ? [String(resolved[f.key])] : []} : f)}
}
