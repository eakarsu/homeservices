import { PrismaClient, Prisma, TradeType } from '@prisma/client'
import { createHash } from 'node:crypto'
import { hash } from 'bcryptjs'

type TransactionClient = Prisma.TransactionClient
export const DEMO_ROWS = 15
const names = [
  ['Avery', 'Morgan'], ['Jordan', 'Bennett'], ['Taylor', 'Brooks'], ['Casey', 'Reed'],
  ['Riley', 'Parker'], ['Morgan', 'Hayes'], ['Alex', 'Rivera'], ['Jamie', 'Collins'],
  ['Cameron', 'Foster'], ['Drew', 'Sullivan'], ['Reese', 'Bailey'], ['Quinn', 'Ward'],
  ['Skyler', 'Price'], ['Rowan', 'Bell'], ['Emerson', 'Gray'],
]
const services: [string, TradeType][] = [
  ['AC diagnostic visit', 'HVAC'], ['AC seasonal tune-up', 'HVAC'], ['Furnace inspection', 'HVAC'],
  ['Heat pump maintenance', 'HVAC'], ['Thermostat installation', 'HVAC'],
  ['Faucet repair', 'PLUMBING'], ['Drain cleaning', 'PLUMBING'], ['Water heater inspection', 'PLUMBING'],
  ['Leak assessment', 'PLUMBING'], ['Toilet repair', 'PLUMBING'],
  ['Outlet replacement', 'ELECTRICAL'], ['Panel inspection', 'ELECTRICAL'], ['Lighting installation', 'ELECTRICAL'],
  ['Ceiling fan installation', 'ELECTRICAL'], ['Home maintenance visit', 'GENERAL'],
]
const partNames = ['Dual-run capacitor', 'Air filter 16x25x1', 'Air filter 20x25x1', 'Smart thermostat', 'HVAC contactor', 'Half-inch ball valve', 'Three-quarter-inch ball valve', 'Faucet cartridge', 'Drain trap kit', 'Water heater connector', '20A outlet', 'GFCI outlet', 'Single-pole switch', 'LED fixture', 'Weatherproof junction box']

/** Insert missing sample rows only. Never reassign accounts or overwrite existing work. */
export async function seedDemoDataForCompany(tx: TransactionClient, companyId: string, adminUserId: string) {
  const owner = await tx.user.findFirst({ where: { id: adminUserId, companyId, role: 'ADMIN' } })
  if (!owner) throw new Error('Demo data requires an administrator of the target company')
  // Serialize repeat/concurrent loads for this company without adding schema objects.
  await tx.$queryRaw`SELECT id FROM "Company" WHERE id = ${companyId} FOR UPDATE`
  const password = process.env.DEMO_PASSWORD || process.env.ADMIN_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD || ''
  if (password.length < 12) throw new Error('Set a DEMO_PASSWORD with at least 12 characters')
  const passwordHash = await hash(password, 12)
  const tag = createHash('sha256').update(companyId).digest('hex').slice(0, 12)
  const key = (kind: string, i: number) => `demo-${tag}-${kind}-${String(i + 1).padStart(3, '0')}`
  const stamp = (days: number, hour = 9) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d }
  const sampleNote = 'DEMO SAMPLE — fictional data for evaluating the application. No external service, delivery or charge has occurred.'

  for (let i = 0; i < DEMO_ROWS; i++) {
    const [firstName, lastName] = names[i], [serviceName, tradeType] = services[i]
    const service = await tx.serviceType.upsert({ where: { id: key('service', i) }, update: {}, create: { id: key('service', i), companyId, name: `Demo ${serviceName}`, code: `DEMO-${String(i + 1).padStart(3, '0')}`, tradeType, defaultDuration: 90, color: ['#2563eb', '#16a34a', '#d97706'][i % 3] } })
    const truck = await tx.truck.upsert({ where: { id: key('truck', i) }, update: {}, create: { id: key('truck', i), companyId, name: `Demo Service Van ${i + 1}`, vehicleId: `DEMO-${i + 1}`, make: 'Ford', model: 'Transit', year: 2023 } })
    const technicianUser = await tx.user.upsert({ where: { id: key('user', i) }, update: {}, create: { id: key('user', i), companyId, email: `demo.tech.${i + 1}.${tag}@example.invalid`, password: passwordHash, firstName, lastName: `${lastName} (Demo)`, role: 'TECHNICIAN', isActive: true, emailVerified: true, phone: `202-555-${String(100 + i).padStart(4, '0')}` } })
    const tech = await tx.technician.upsert({ where: { id: key('tech', i) }, update: {}, create: { id: key('tech', i), userId: technicianUser.id, truckId: truck.id, employeeId: `DEMO-${i + 1}`, tradeTypes: [tradeType], certifications: [], hourlyRate: 30 + i, payType: 'HOURLY', status: 'AVAILABLE', color: ['#2563eb', '#16a34a', '#d97706'][i % 3] } })
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) await tx.techSchedule.upsert({ where: { technicianId_dayOfWeek: { technicianId: tech.id, dayOfWeek } }, update: {}, create: { technicianId: tech.id, dayOfWeek, startTime: '08:00', endTime: '17:00' } })
    const customer = await tx.customer.upsert({ where: { id: key('customer', i) }, update: {}, create: { id: key('customer', i), companyId, customerNumber: `DEMO-${tag}-CUS-${i + 1}`, firstName, lastName: `${lastName} (Demo)`, companyName: i % 5 === 0 ? `Demo ${lastName} Offices` : null, type: i % 5 === 0 ? 'COMMERCIAL' : 'RESIDENTIAL', status: 'ACTIVE', email: `demo.customer.${i + 1}.${tag}@example.invalid`, phone: `202-555-${String(100 + i).padStart(4, '0')}`, billingAddress: `${100 + i * 10} Example Lane`, billingCity: 'Atlanta', billingState: 'GA', billingZip: `303${String(i + 1).padStart(2, '0')}`, notes: sampleNote, tags: ['demo'], doNotCall: true, doNotEmail: true, doNotText: true } })
    const property = await tx.property.upsert({ where: { id: key('property', i) }, update: {}, create: { id: key('property', i), customerId: customer.id, name: 'Demo primary property', type: 'House', address: `${100 + i * 10} Example Lane`, city: 'Atlanta', state: 'GA', zip: `303${String(i + 1).padStart(2, '0')}`, sqFootage: 1400 + i * 100, yearBuilt: 1995 + i, notes: sampleNote } })
    const equipment = await tx.equipment.upsert({ where: { id: key('equipment', i) }, update: {}, create: { id: key('equipment', i), propertyId: property.id, type: tradeType === 'PLUMBING' ? 'WATER_HEATER' : tradeType === 'ELECTRICAL' ? 'ELECTRICAL_PANEL' : 'AC_UNIT', brand: 'Demo equipment', model: `Sample-${i + 1}`, serialNumber: `DEMO-${tag}-${i + 1}`, installDate: stamp(-900), lastServiceDate: stamp(-120), nextServiceDue: stamp(30 + i), warrantyExpires: stamp(365), location: 'Utility area', notes: sampleNote, photos: [] } })
    const part = await tx.part.upsert({ where: { id: key('part', i) }, update: {}, create: { id: key('part', i), companyId, partNumber: `DEMO-PART-${i + 1}`, name: `Demo ${partNames[i]}`, description: sampleNote, category: tradeType, manufacturer: 'Demo supplier', cost: 10 + i * 3, price: 25 + i * 5, quantityOnHand: i % 4 === 0 ? 3 : 20 + i, reorderLevel: 5, reorderQty: 10, warehouseLocation: `A-${i + 1}` } })
    await tx.truckStock.upsert({ where: { truckId_partId: { truckId: truck.id, partId: part.id } }, update: {}, create: { truckId: truck.id, partId: part.id, quantity: 3 + i % 4, minQuantity: 2, maxQuantity: 10 } })
    const pricebook = await tx.pricebookItem.upsert({ where: { id: key('pricebook', i) }, update: {}, create: { id: key('pricebook', i), companyId, code: `DEMO-SVC-${i + 1}`, name: `Demo ${serviceName}`, description: sampleNote, category: 'Labor', type: 'Flat Rate', unitCost: 50 + i * 5, unitPrice: 150 + i * 20, laborMinutes: 90, isTaxable: true } })
    const plan = await tx.agreementPlan.upsert({ where: { id: key('plan', i) }, update: {}, create: { id: key('plan', i), companyId, name: `Demo ${serviceName} plan`, description: sampleNote, tradeType, monthlyPrice: 15 + i, annualPrice: (15 + i) * 10, visitsIncluded: 2, discountPct: 10, priorityService: i % 2 === 0, includedServices: [serviceName, 'Scheduled equipment check'] } })
    await tx.serviceAgreement.upsert({ where: { id: key('agreement', i) }, update: {}, create: { id: key('agreement', i), agreementNumber: `DEMO-${tag}-AGR-${i + 1}`, customerId: customer.id, planId: plan.id, status: i % 4 === 0 ? 'PENDING' : 'ACTIVE', startDate: stamp(-30), endDate: stamp(335), billingFrequency: 'annual', autoRenew: false, paymentStatus: 'trial', visitsUsed: 0, nextVisitDue: stamp(30 + i), notes: sampleNote } })

    for (let completed = 0; completed < 2; completed++) {
      const jobId = key(completed ? 'job-completed' : 'job', i)
      const start = stamp(completed ? -1 - i : 0, 8 + i % 7), end = new Date(start.getTime() + 90 * 60000)
      const job = await tx.job.upsert({ where: { id: jobId }, update: {}, create: { id: jobId, companyId, customerId: customer.id, propertyId: property.id, serviceTypeId: service.id, createdById: adminUserId, jobNumber: `DEMO-${tag}-${completed ? 'DONE' : 'JOB'}-${i + 1}`, title: `Demo: ${serviceName}`, tradeType, status: completed ? 'COMPLETED' : i % 5 === 0 ? 'PENDING' : 'SCHEDULED', priority: i % 5 === 0 ? 'HIGH' : 'NORMAL', type: 'SERVICE_CALL', description: sampleNote, scheduledStart: start, scheduledEnd: end, estimatedDuration: 90, timeWindowStart: `${String(start.getHours()).padStart(2, '0')}:00`, timeWindowEnd: `${String(start.getHours() + 2).padStart(2, '0')}:00`, estimatedAmount: 150 + i * 20, actualAmount: completed ? 150 + i * 20 : null, actualStart: completed ? start : null, actualEnd: completed ? end : null, completedAt: completed ? end : null, workPerformed: completed ? `Demo completed ${serviceName}; simulated service record.` : null, tags: ['demo'], notes: sampleNote } })
      if (completed || i % 5 !== 0) await tx.jobAssignment.upsert({ where: { id: key(completed ? 'assignment-completed' : 'assignment', i) }, update: {}, create: { id: key(completed ? 'assignment-completed' : 'assignment', i), jobId: job.id, technicianId: tech.id, isPrimary: true } })
      if (completed) {
        await tx.timeEntry.upsert({ where: { id: key('time', i) }, update: {}, create: { id: key('time', i), jobId: job.id, technicianId: tech.id, type: 'WORK', startTime: start, endTime: end, duration: 90, notes: sampleNote } })
        await tx.serviceHistory.upsert({ where: { id: key('history', i) }, update: {}, create: { id: key('history', i), jobId: job.id, propertyId: property.id, equipmentId: equipment.id, type: 'Maintenance', date: start, description: `Demo ${serviceName}`, technicianName: `${firstName} ${lastName} (Demo)`, notes: sampleNote } })
        await tx.jobPart.upsert({ where: { id: key('job-part', i) }, update: {}, create: { id: key('job-part', i), jobId: job.id, partId: part.id, quantity: 1, unitPrice: 25 + i * 5, totalPrice: 25 + i * 5 } })
      }
    }
    await tx.followUpTask.upsert({ where: { id: key('followup', i) }, update: {}, create: {
      id: key('followup', i), companyId, customerId: customer.id, jobId: key('job', i), assigneeId: adminUserId,
      title: `Demo follow-up: ${serviceName}`, notes: sampleNote, dueAt: stamp(i - 4), status: 'OPEN',
      messageDraft: '', checklist: [{ text: 'Review the linked job details', done: false }, { text: 'Verify contact preferences before planning outreach', done: false }],
    } })
    const base = 150 + i * 20, tax = Math.round(base * .08 * 100) / 100, total = base + tax
    const estimate = await tx.estimate.upsert({ where: { id: key('estimate', i) }, update: {}, create: { id: key('estimate', i), customerId: customer.id, jobId: key('job', i), estimateNumber: `DEMO-${tag}-EST-${i + 1}`, status: 'DRAFT', createdDate: stamp(-i), expirationDate: stamp(30), retentionUntil: stamp(365 * 7), subtotal: base, taxAmount: tax, totalAmount: total, notes: sampleNote, terms: 'Demo only. Requires actual review and customer approval before use.' } })
    for (let option = 0; option < 3; option++) {
      const amount = base + option * 75, optionTax = Math.round(amount * .08 * 100) / 100
      const optionId = `${key('option', i)}-${option}`
      await tx.estimateOption.upsert({ where: { id: optionId }, update: {}, create: { id: optionId, estimateId: estimate.id, name: ['Good', 'Better', 'Best'][option], description: `${['Basic service', 'Service and preventive check', 'Service and extended maintenance'][option]} (Demo)`, sortOrder: option, isRecommended: option === 1, subtotal: amount, taxAmount: optionTax, totalAmount: amount + optionTax } })
      await tx.estimateLineItem.upsert({ where: { id: `${optionId}-line` }, update: {}, create: { id: `${optionId}-line`, optionId, pricebookItemId: pricebook.id, description: `Demo ${serviceName}`, category: 'Labor', quantity: 1, unitPrice: amount, totalPrice: amount } })
    }
    for (let paid = 0; paid < 2; paid++) {
      const invoiceId = key(paid ? 'invoice-paid' : 'invoice', i)
      await tx.invoice.upsert({ where: { id: invoiceId }, update: {}, create: { id: invoiceId, customerId: customer.id, jobId: key('job-completed', i), invoiceNumber: `DEMO-${tag}-${paid ? 'PAID' : 'INV'}-${i + 1}`, status: paid ? 'PAID' : i % 2 === 0 ? 'OVERDUE' : 'DRAFT', issueDate: stamp(-45 - i), dueDate: stamp(paid ? -15 : i % 2 === 0 ? -5 : 15), paidDate: paid ? stamp(-10 - i) : null, subtotal: base, taxRate: .08, taxAmount: tax, totalAmount: total, paidAmount: paid ? total : 0, balanceDue: paid ? 0 : total, notes: sampleNote } })
      await tx.invoiceLineItem.upsert({ where: { id: `${invoiceId}-line` }, update: {}, create: { id: `${invoiceId}-line`, invoiceId, description: `Demo ${serviceName}`, quantity: 1, unitPrice: base, totalPrice: base, category: 'Labor' } })
      if (paid) await tx.payment.upsert({ where: { id: key('payment', i) }, update: {}, create: { id: key('payment', i), invoiceId, amount: total, method: 'OTHER', reference: `DEMO-SIMULATED-${i + 1}`, date: stamp(-10 - i), notes: sampleNote } })
    }
    await tx.communication.upsert({ where: { id: key('note', i) }, update: {}, create: { id: key('note', i), customerId: customer.id, type: 'NOTE', direction: 'internal', subject: 'Demo customer service note', message: sampleNote, status: 'recorded' } })
    const purchaseOrderId = key('po', i), cost = 10 + i * 3
    await tx.purchaseOrder.upsert({ where: { id: purchaseOrderId }, update: {}, create: { id: purchaseOrderId, poNumber: `DEMO-${tag}-PO-${i + 1}`, status: 'DRAFT', vendorName: 'Demo Supply Company', subtotal: cost * 10, taxAmount: 0, totalAmount: cost * 10, notes: sampleNote } })
    await tx.purchaseOrderItem.upsert({ where: { id: `${purchaseOrderId}-item` }, update: {}, create: { id: `${purchaseOrderId}-item`, purchaseOrderId, partId: part.id, quantity: 10, unitCost: cost, totalCost: cost * 10, receivedQty: 0 } })
  }
  return { followUps: DEMO_ROWS, customers: DEMO_ROWS, properties: DEMO_ROWS, equipment: DEMO_ROWS, technicians: DEMO_ROWS, trucks: DEMO_ROWS, serviceTypes: DEMO_ROWS, agreementPlans: DEMO_ROWS, jobs: DEMO_ROWS * 2, invoices: DEMO_ROWS * 2, payments: DEMO_ROWS, estimates: DEMO_ROWS, parts: DEMO_ROWS, pricebook: DEMO_ROWS, agreements: DEMO_ROWS, purchaseOrders: DEMO_ROWS, timeEntries: DEMO_ROWS, notes: DEMO_ROWS }
}

export async function loadDemoData(prisma: PrismaClient, adminEmail: string) {
  const admin = await prisma.user.findUnique({ where: { email: adminEmail.trim().toLowerCase() } })
  if (!admin || admin.role !== 'ADMIN') throw new Error('Create the configured administrator before loading demo data')
  return prisma.$transaction(tx => seedDemoDataForCompany(tx, admin.companyId, admin.id), { timeout: 60000, maxWait: 10000 })
}
