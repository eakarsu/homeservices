import { PrismaClient, Prisma } from '@prisma/client'

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export async function seedDemoDataForCompany(
  tx: TransactionClient,
  companyId: string,
  adminUserId: string
) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Use company ID prefix for unique identifiers
  const prefix = companyId.slice(0, 8)

  // Create demo technician users
  const techUsers = await Promise.all([
    tx.user.create({
      data: {
        email: `demo.tech1.${companyId.slice(0, 8)}@example.com`,
        password: 'demo-not-for-login',
        firstName: 'Tom',
        lastName: 'Wilson',
        phone: '(555) 100-0001',
        role: 'TECHNICIAN',
        companyId,
        isActive: true,
      },
    }),
    tx.user.create({
      data: {
        email: `demo.tech2.${companyId.slice(0, 8)}@example.com`,
        password: 'demo-not-for-login',
        firstName: 'Sarah',
        lastName: 'Martinez',
        phone: '(555) 100-0002',
        role: 'TECHNICIAN',
        companyId,
        isActive: true,
      },
    }),
    tx.user.create({
      data: {
        email: `demo.tech3.${companyId.slice(0, 8)}@example.com`,
        password: 'demo-not-for-login',
        firstName: 'Mike',
        lastName: 'Johnson',
        phone: '(555) 100-0003',
        role: 'TECHNICIAN',
        companyId,
        isActive: true,
      },
    }),
  ])

  // Create technician profiles
  const technicians = await Promise.all([
    tx.technician.create({
      data: {
        userId: techUsers[0].id,
        employeeId: 'DEMO-001',
        color: '#3B82F6',
        tradeTypes: ['HVAC'],
        certifications: ['EPA 608 Universal', 'NATE Certified'],
        payType: 'HOURLY',
        hourlyRate: 35,
        status: 'AVAILABLE',
      },
    }),
    tx.technician.create({
      data: {
        userId: techUsers[1].id,
        employeeId: 'DEMO-002',
        color: '#22C55E',
        tradeTypes: ['PLUMBING'],
        certifications: ['Master Plumber'],
        payType: 'HOURLY',
        hourlyRate: 38,
        status: 'AVAILABLE',
      },
    }),
    tx.technician.create({
      data: {
        userId: techUsers[2].id,
        employeeId: 'DEMO-003',
        color: '#F59E0B',
        tradeTypes: ['ELECTRICAL'],
        certifications: ['Master Electrician'],
        payType: 'HOURLY',
        hourlyRate: 40,
        status: 'AVAILABLE',
      },
    }),
  ])

  // Create demo customers
  const customersData = [
    { firstName: 'John', lastName: 'Smith', phone: '(555) 200-0001', email: 'john.smith@example.com', address: '100 Oak Street', city: 'Atlanta', state: 'GA', zip: '30301' },
    { firstName: 'Emily', lastName: 'Johnson', phone: '(555) 200-0002', email: 'emily.j@example.com', address: '200 Maple Ave', city: 'Atlanta', state: 'GA', zip: '30302' },
    { firstName: 'Michael', lastName: 'Williams', phone: '(555) 200-0003', email: 'mwilliams@example.com', address: '300 Pine Road', city: 'Atlanta', state: 'GA', zip: '30303' },
    { firstName: 'Sarah', lastName: 'Brown', phone: '(555) 200-0004', email: 'sbrown@example.com', address: '400 Elm Street', city: 'Atlanta', state: 'GA', zip: '30304' },
    { firstName: 'David', lastName: 'Jones', phone: '(555) 200-0005', email: 'djones@example.com', address: '500 Cedar Lane', city: 'Atlanta', state: 'GA', zip: '30305' },
  ]

  const customers: { customer: Awaited<ReturnType<typeof tx.customer.create>>; property: Awaited<ReturnType<typeof tx.property.create>> }[] = []

  for (let i = 0; i < customersData.length; i++) {
    const c = customersData[i]
    const customer = await tx.customer.create({
      data: {
        customerNumber: `${prefix}-${(i + 1).toString().padStart(5, '0')}`,
        type: 'RESIDENTIAL',
        status: 'ACTIVE',
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        billingAddress: c.address,
        billingCity: c.city,
        billingState: c.state,
        billingZip: c.zip,
        companyId,
      },
    })

    const property = await tx.property.create({
      data: {
        name: 'Primary Residence',
        type: 'House',
        address: c.address,
        city: c.city,
        state: c.state,
        zip: c.zip,
        customerId: customer.id,
      },
    })

    // Add equipment to first 3 customers
    if (i < 3) {
      await tx.equipment.create({
        data: {
          type: 'AC_UNIT',
          brand: 'Carrier',
          model: '24ACC636A003',
          serialNumber: `DEMO-AC-${i + 1}`,
          installDate: new Date(2022, 5, 15),
          warrantyExpires: new Date(2032, 5, 15),
          location: 'Backyard',
          propertyId: property.id,
        },
      })
    }

    customers.push({ customer, property })
  }

  // Get service types for this company
  const serviceTypes = await tx.serviceType.findMany({
    where: { companyId },
  })

  // Create jobs for today (visible on dispatch board)
  const todayJobs = [
    { title: 'AC not cooling - urgent', tradeType: 'HVAC', priority: 'HIGH', status: 'SCHEDULED', hour: 9, techIdx: 0 },
    { title: 'Leaky bathroom faucet', tradeType: 'PLUMBING', priority: 'NORMAL', status: 'SCHEDULED', hour: 10, techIdx: 1 },
    { title: 'Thermostat replacement', tradeType: 'HVAC', priority: 'NORMAL', status: 'IN_PROGRESS', hour: 11, techIdx: 0 },
    { title: 'Outlet not working', tradeType: 'ELECTRICAL', priority: 'NORMAL', status: 'SCHEDULED', hour: 14, techIdx: 2 },
  ]

  for (let i = 0; i < todayJobs.length; i++) {
    const jobData = todayJobs[i]
    const customerData = customers[i % customers.length]
    const scheduledDate = new Date(today)
    scheduledDate.setHours(jobData.hour, 0, 0, 0)

    const job = await tx.job.create({
      data: {
        jobNumber: `${prefix}-${today.getFullYear()}-${(i + 1).toString().padStart(4, '0')}`,
        status: jobData.status as 'SCHEDULED' | 'IN_PROGRESS',
        priority: jobData.priority as 'NORMAL' | 'HIGH',
        type: 'SERVICE_CALL',
        tradeType: jobData.tradeType as 'HVAC' | 'PLUMBING' | 'ELECTRICAL',
        title: jobData.title,
        description: `Demo job: ${jobData.title}`,
        scheduledStart: scheduledDate,
        estimatedDuration: 90,
        timeWindowStart: `${jobData.hour}:00`,
        timeWindowEnd: `${jobData.hour + 2}:00`,
        companyId,
        customerId: customerData.customer.id,
        propertyId: customerData.property.id,
        createdById: adminUserId,
        serviceTypeId: serviceTypes.length > 0 ? serviceTypes[0].id : undefined,
        estimatedAmount: 150 + (i * 50),
      },
    })

    await tx.jobAssignment.create({
      data: {
        jobId: job.id,
        technicianId: technicians[jobData.techIdx].id,
        isPrimary: true,
      },
    })
  }

  // Create unassigned jobs (for dispatch queue)
  const unassignedJobs = [
    { title: 'Emergency: No hot water!', tradeType: 'PLUMBING', priority: 'EMERGENCY', hour: 10 },
    { title: 'AC blowing warm air', tradeType: 'HVAC', priority: 'HIGH', hour: 13 },
  ]

  for (let i = 0; i < unassignedJobs.length; i++) {
    const jobData = unassignedJobs[i]
    const customerData = customers[(i + 3) % customers.length]
    const scheduledDate = new Date(today)
    scheduledDate.setHours(jobData.hour, 0, 0, 0)

    await tx.job.create({
      data: {
        jobNumber: `${prefix}-${today.getFullYear()}-${(100 + i).toString().padStart(4, '0')}`,
        status: 'PENDING',
        priority: jobData.priority as 'HIGH' | 'EMERGENCY',
        type: 'SERVICE_CALL',
        tradeType: jobData.tradeType as 'HVAC' | 'PLUMBING',
        title: jobData.title,
        description: `Demo unassigned job: ${jobData.title}`,
        scheduledStart: scheduledDate,
        estimatedDuration: 60,
        timeWindowStart: `${jobData.hour}:00`,
        timeWindowEnd: `${jobData.hour + 2}:00`,
        companyId,
        customerId: customerData.customer.id,
        propertyId: customerData.property.id,
        createdById: adminUserId,
      },
    })
  }

  // Create completed jobs (for reports)
  for (let i = 0; i < 10; i++) {
    const customerData = customers[i % customers.length]
    const completedDate = new Date(today)
    completedDate.setDate(today.getDate() - (i * 3) - 1)
    completedDate.setHours(10, 0, 0, 0)

    const job = await tx.job.create({
      data: {
        jobNumber: `${prefix}-${today.getFullYear()}-${(200 + i).toString().padStart(4, '0')}`,
        status: 'COMPLETED',
        priority: 'NORMAL',
        type: 'SERVICE_CALL',
        tradeType: ['HVAC', 'PLUMBING', 'ELECTRICAL'][i % 3] as 'HVAC' | 'PLUMBING' | 'ELECTRICAL',
        title: ['AC Repair', 'Plumbing Fix', 'Electrical Repair'][i % 3],
        description: 'Demo completed job',
        scheduledStart: completedDate,
        estimatedDuration: 90,
        companyId,
        customerId: customerData.customer.id,
        propertyId: customerData.property.id,
        createdById: adminUserId,
        completedAt: new Date(completedDate.getTime() + 2 * 60 * 60 * 1000),
        actualAmount: 200 + (i * 75),
        estimatedAmount: 175 + (i * 50),
      },
    })

    await tx.jobAssignment.create({
      data: {
        jobId: job.id,
        technicianId: technicians[i % technicians.length].id,
        isPrimary: true,
      },
    })
  }

  // Create invoices
  for (let i = 0; i < 8; i++) {
    const customerData = customers[i % customers.length]
    const status = i < 5 ? 'PAID' : 'SENT'
    const issueDate = new Date(today)
    issueDate.setDate(today.getDate() - (i * 5))
    const dueDate = new Date(issueDate)
    dueDate.setDate(issueDate.getDate() + 30)

    const subtotal = 250 + (i * 100)
    const taxAmount = subtotal * 0.08
    const totalAmount = subtotal + taxAmount
    const paidAmount = status === 'PAID' ? totalAmount : 0

    await tx.invoice.create({
      data: {
        invoiceNumber: `${prefix}-INV-${(i + 1).toString().padStart(4, '0')}`,
        status: status as 'PAID' | 'SENT',
        issueDate,
        dueDate,
        paidDate: status === 'PAID' ? new Date(issueDate.getTime() + 3 * 24 * 60 * 60 * 1000) : null,
        subtotal,
        taxRate: 0.08,
        taxAmount,
        totalAmount,
        paidAmount,
        balanceDue: totalAmount - paidAmount,
        customerId: customerData.customer.id,
      },
    })
  }

  // Create parts/inventory
  const parts = [
    { partNumber: 'CAP-35-5', name: '35/5 MFD Capacitor', category: 'HVAC', cost: 8, price: 25, quantityOnHand: 15 },
    { partNumber: 'FILT-16-25-1', name: 'Filter 16x25x1', category: 'HVAC', cost: 3, price: 12, quantityOnHand: 30 },
    { partNumber: 'THERM-NEST', name: 'Nest Thermostat', category: 'HVAC', cost: 120, price: 299, quantityOnHand: 5 },
    { partNumber: 'VALVE-1/2', name: '1/2" Ball Valve', category: 'Plumbing', cost: 8, price: 25, quantityOnHand: 20 },
    { partNumber: 'OUTLET-20A', name: '20A Outlet', category: 'Electrical', cost: 5, price: 15, quantityOnHand: 25 },
  ]

  for (const part of parts) {
    await tx.part.create({
      data: {
        ...part,
        manufacturer: 'Demo Brand',
        reorderLevel: 5,
        companyId,
      },
    })
  }

  // Create estimates
  for (let i = 0; i < 5; i++) {
    const customerData = customers[i]
    const createdDate = new Date(today)
    createdDate.setDate(today.getDate() - (i * 2))
    const expirationDate = new Date(createdDate)
    expirationDate.setDate(createdDate.getDate() + 30)

    const statuses = ['SENT', 'VIEWED', 'APPROVED', 'DRAFT', 'SENT']
    const goodPrice = 1500 + (i * 500)

    const estimate = await tx.estimate.create({
      data: {
        estimateNumber: `${prefix}-EST-${(i + 1).toString().padStart(4, '0')}`,
        status: statuses[i] as 'DRAFT' | 'SENT' | 'VIEWED' | 'APPROVED',
        createdDate,
        expirationDate,
        approvedAt: statuses[i] === 'APPROVED' ? new Date() : null,
        selectedOption: statuses[i] === 'APPROVED' ? 'better' : null,
        subtotal: goodPrice * 1.3,
        taxAmount: goodPrice * 1.3 * 0.08,
        totalAmount: goodPrice * 1.3 * 1.08,
        notes: `Demo estimate for ${customerData.customer.firstName}`,
        customerId: customerData.customer.id,
      },
    })

    // Create options
    await tx.estimateOption.create({
      data: {
        name: 'Good',
        description: 'Basic option',
        sortOrder: 0,
        subtotal: goodPrice,
        taxAmount: goodPrice * 0.08,
        totalAmount: goodPrice * 1.08,
        isRecommended: false,
        estimateId: estimate.id,
      },
    })

    await tx.estimateOption.create({
      data: {
        name: 'Better',
        description: 'Recommended option',
        sortOrder: 1,
        subtotal: goodPrice * 1.3,
        taxAmount: goodPrice * 1.3 * 0.08,
        totalAmount: goodPrice * 1.3 * 1.08,
        isRecommended: true,
        estimateId: estimate.id,
      },
    })

    await tx.estimateOption.create({
      data: {
        name: 'Best',
        description: 'Premium option',
        sortOrder: 2,
        subtotal: goodPrice * 1.6,
        taxAmount: goodPrice * 1.6 * 0.08,
        totalAmount: goodPrice * 1.6 * 1.08,
        isRecommended: false,
        estimateId: estimate.id,
      },
    })
  }

  // Create service agreements
  const agreementPlans = await tx.agreementPlan.findMany({
    where: { companyId },
  })

  const agreementStatuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'PENDING', 'EXPIRED'] as const
  const billingFrequencies = ['monthly', 'annual'] as const

  for (let i = 0; i < Math.min(15, customers.length * 3); i++) {
    const customerData = customers[i % customers.length]
    const plan = agreementPlans[i % agreementPlans.length]
    const status = agreementStatuses[i % agreementStatuses.length]
    const billingFreq = billingFrequencies[i % billingFrequencies.length]

    const startDate = new Date(today)
    startDate.setMonth(today.getMonth() - (i * 2))

    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + 1)

    if (status === 'EXPIRED') {
      endDate.setMonth(today.getMonth() - 1)
    }

    await tx.serviceAgreement.create({
      data: {
        agreementNumber: `${prefix}-AGR-${(i + 1).toString().padStart(4, '0')}`,
        customerId: customerData.customer.id,
        planId: plan.id,
        status,
        billingFrequency: billingFreq,
        startDate,
        endDate,
        autoRenew: i % 2 === 0,
        visitsUsed: Math.floor(Math.random() * (plan.visitsIncluded + 1)),
        notes: `Demo service agreement ${i + 1}`,
      },
    })
  }

  return {
    technicians: technicians.length,
    customers: customers.length,
    jobs: todayJobs.length + unassignedJobs.length + 10,
    invoices: 8,
    estimates: 5,
    parts: parts.length,
    agreements: Math.min(15, customers.length * 3),
  }
}
