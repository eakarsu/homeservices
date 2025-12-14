import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create Company
  const company = await prisma.company.create({
    data: {
      name: 'Comfort Pro HVAC & Plumbing',
      phone: '(555) 123-4567',
      email: 'info@comfortpro.com',
      website: 'https://comfortpro.com',
      timezone: 'America/New_York',
      address: '123 Service Way',
      city: 'Atlanta',
      state: 'GA',
      zip: '30301',
      licenseNumber: 'HVAC-2024-001',
      serviceArea: ['30301', '30302', '30303', '30304', '30305', '30306', '30307', '30308', '30309', '30310'],
    },
  })
  console.log('Created company:', company.name)

  // Create Users
  const passwordHash = await hash('password123', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@comfortpro.com',
      password: passwordHash,
      firstName: 'Mike',
      lastName: 'Johnson',
      phone: '(555) 100-0001',
      role: 'ADMIN',
      companyId: company.id,
    },
  })

  const dispatcher = await prisma.user.create({
    data: {
      email: 'sarah@comfortpro.com',
      password: passwordHash,
      firstName: 'Sarah',
      lastName: 'Davis',
      phone: '(555) 100-0002',
      role: 'DISPATCHER',
      companyId: company.id,
    },
  })

  const techTom = await prisma.user.create({
    data: {
      email: 'tom@comfortpro.com',
      password: passwordHash,
      firstName: 'Tom',
      lastName: 'Wilson',
      phone: '(555) 100-0003',
      role: 'TECHNICIAN',
      companyId: company.id,
    },
  })

  const techChris = await prisma.user.create({
    data: {
      email: 'chris@comfortpro.com',
      password: passwordHash,
      firstName: 'Chris',
      lastName: 'Martinez',
      phone: '(555) 100-0004',
      role: 'TECHNICIAN',
      companyId: company.id,
    },
  })

  const techDave = await prisma.user.create({
    data: {
      email: 'dave@comfortpro.com',
      password: passwordHash,
      firstName: 'Dave',
      lastName: 'Brown',
      phone: '(555) 100-0005',
      role: 'TECHNICIAN',
      companyId: company.id,
    },
  })

  const officeManager = await prisma.user.create({
    data: {
      email: 'lisa@comfortpro.com',
      password: passwordHash,
      firstName: 'Lisa',
      lastName: 'Anderson',
      phone: '(555) 100-0006',
      role: 'OFFICE',
      companyId: company.id,
    },
  })

  console.log('Created 6 users')

  // Create Trucks
  const truck1 = await prisma.truck.create({
    data: {
      name: 'Truck 1',
      vehicleId: 'ABC-1234',
      make: 'Ford',
      model: 'E-350 Van',
      year: 2022,
      companyId: company.id,
    },
  })

  const truck2 = await prisma.truck.create({
    data: {
      name: 'Truck 2',
      vehicleId: 'DEF-5678',
      make: 'Chevrolet',
      model: 'Express',
      year: 2021,
      companyId: company.id,
    },
  })

  const truck3 = await prisma.truck.create({
    data: {
      name: 'Truck 3',
      vehicleId: 'GHI-9012',
      make: 'Ford',
      model: 'Transit',
      year: 2023,
      companyId: company.id,
    },
  })

  console.log('Created 3 trucks')

  // Create Technicians
  const technicianTom = await prisma.technician.create({
    data: {
      userId: techTom.id,
      employeeId: 'EMP-001',
      color: '#3B82F6',
      tradeTypes: ['HVAC'],
      certifications: ['EPA 608 Universal', 'NATE Certified'],
      payType: 'HOURLY',
      hourlyRate: 35,
      status: 'AVAILABLE',
      truckId: truck1.id,
    },
  })

  const technicianChris = await prisma.technician.create({
    data: {
      userId: techChris.id,
      employeeId: 'EMP-002',
      color: '#22C55E',
      tradeTypes: ['PLUMBING'],
      certifications: ['Master Plumber', 'Gas Line Certified'],
      payType: 'HOURLY',
      hourlyRate: 38,
      status: 'AVAILABLE',
      truckId: truck2.id,
    },
  })

  const technicianDave = await prisma.technician.create({
    data: {
      userId: techDave.id,
      employeeId: 'EMP-003',
      color: '#F59E0B',
      tradeTypes: ['HVAC', 'ELECTRICAL'],
      certifications: ['EPA 608 Universal', 'Journeyman Electrician'],
      payType: 'HOURLY',
      hourlyRate: 32,
      status: 'AVAILABLE',
      truckId: truck3.id,
    },
  })

  console.log('Created 3 technicians')

  // Create Service Types
  const serviceTypes = await Promise.all([
    prisma.serviceType.create({
      data: { name: 'HVAC Repair', code: 'HVAC-REP', tradeType: 'HVAC', defaultDuration: 120, color: '#3B82F6', companyId: company.id },
    }),
    prisma.serviceType.create({
      data: { name: 'HVAC Maintenance', code: 'HVAC-MAINT', tradeType: 'HVAC', defaultDuration: 90, color: '#60A5FA', companyId: company.id },
    }),
    prisma.serviceType.create({
      data: { name: 'AC Installation', code: 'AC-INST', tradeType: 'HVAC', defaultDuration: 480, color: '#2563EB', companyId: company.id },
    }),
    prisma.serviceType.create({
      data: { name: 'Furnace Installation', code: 'FURN-INST', tradeType: 'HVAC', defaultDuration: 360, color: '#1D4ED8', companyId: company.id },
    }),
    prisma.serviceType.create({
      data: { name: 'Plumbing Repair', code: 'PLMB-REP', tradeType: 'PLUMBING', defaultDuration: 90, color: '#22C55E', companyId: company.id },
    }),
    prisma.serviceType.create({
      data: { name: 'Plumbing Maintenance', code: 'PLMB-MAINT', tradeType: 'PLUMBING', defaultDuration: 60, color: '#4ADE80', companyId: company.id },
    }),
    prisma.serviceType.create({
      data: { name: 'Water Heater Install', code: 'WH-INST', tradeType: 'PLUMBING', defaultDuration: 240, color: '#16A34A', companyId: company.id },
    }),
    prisma.serviceType.create({
      data: { name: 'Drain Cleaning', code: 'DRAIN', tradeType: 'PLUMBING', defaultDuration: 60, color: '#15803D', companyId: company.id },
    }),
    prisma.serviceType.create({
      data: { name: 'Electrical Repair', code: 'ELEC-REP', tradeType: 'ELECTRICAL', defaultDuration: 90, color: '#F59E0B', companyId: company.id },
    }),
    prisma.serviceType.create({
      data: { name: 'Panel Upgrade', code: 'PANEL', tradeType: 'ELECTRICAL', defaultDuration: 300, color: '#D97706', companyId: company.id },
    }),
    prisma.serviceType.create({
      data: { name: 'Inspection', code: 'INSP', tradeType: 'GENERAL', defaultDuration: 60, color: '#6B7280', companyId: company.id },
    }),
    prisma.serviceType.create({
      data: { name: 'Emergency Service', code: 'EMER', tradeType: 'GENERAL', defaultDuration: 120, color: '#EF4444', companyId: company.id },
    }),
  ])

  console.log('Created 12 service types')

  // Create Agreement Plans
  const bronzePlan = await prisma.agreementPlan.create({
    data: {
      name: 'Bronze',
      description: 'Basic maintenance plan with 1 annual visit',
      tradeType: 'HVAC',
      monthlyPrice: 15,
      annualPrice: 149,
      visitsIncluded: 1,
      discountPct: 10,
      priorityService: false,
      noDiagnosticFee: false,
      includedServices: ['Annual tune-up', 'Filter replacement'],
      companyId: company.id,
    },
  })

  const silverPlan = await prisma.agreementPlan.create({
    data: {
      name: 'Silver',
      description: 'Standard maintenance plan with 2 annual visits and priority service',
      tradeType: 'HVAC',
      monthlyPrice: 25,
      annualPrice: 249,
      visitsIncluded: 2,
      discountPct: 15,
      priorityService: true,
      noDiagnosticFee: false,
      includedServices: ['Spring tune-up', 'Fall tune-up', 'Filter replacements', 'Priority scheduling'],
      companyId: company.id,
    },
  })

  const goldPlan = await prisma.agreementPlan.create({
    data: {
      name: 'Gold',
      description: 'Premium maintenance plan with all benefits',
      tradeType: 'HVAC',
      monthlyPrice: 35,
      annualPrice: 349,
      visitsIncluded: 2,
      discountPct: 20,
      priorityService: true,
      noDiagnosticFee: true,
      includedServices: ['Spring tune-up', 'Fall tune-up', 'Filter replacements', 'Priority scheduling', 'No diagnostic fee', 'Parts warranty'],
      companyId: company.id,
    },
  })

  console.log('Created 3 agreement plans')

  // Create Parts
  const parts = await Promise.all([
    prisma.part.create({ data: { partNumber: 'CAP-35-5', name: '35/5 MFD Capacitor', category: 'HVAC', manufacturer: 'Packard', cost: 8, price: 25, quantityOnHand: 20, reorderLevel: 5, companyId: company.id } }),
    prisma.part.create({ data: { partNumber: 'CAP-45-5', name: '45/5 MFD Capacitor', category: 'HVAC', manufacturer: 'Packard', cost: 10, price: 30, quantityOnHand: 15, reorderLevel: 5, companyId: company.id } }),
    prisma.part.create({ data: { partNumber: 'CONT-2P', name: '2-Pole Contactor', category: 'HVAC', manufacturer: 'Mars', cost: 15, price: 45, quantityOnHand: 10, reorderLevel: 3, companyId: company.id } }),
    prisma.part.create({ data: { partNumber: 'FILT-16-25-1', name: 'Filter 16x25x1', category: 'HVAC', manufacturer: 'Honeywell', cost: 3, price: 12, quantityOnHand: 50, reorderLevel: 20, companyId: company.id } }),
    prisma.part.create({ data: { partNumber: 'FILT-20-25-1', name: 'Filter 20x25x1', category: 'HVAC', manufacturer: 'Honeywell', cost: 4, price: 15, quantityOnHand: 40, reorderLevel: 15, companyId: company.id } }),
    prisma.part.create({ data: { partNumber: 'THERM-NEST', name: 'Nest Thermostat', category: 'HVAC', manufacturer: 'Google', cost: 120, price: 299, quantityOnHand: 5, reorderLevel: 2, companyId: company.id } }),
    prisma.part.create({ data: { partNumber: 'THERM-ECOB', name: 'Ecobee Smart Thermostat', category: 'HVAC', manufacturer: 'Ecobee', cost: 150, price: 349, quantityOnHand: 4, reorderLevel: 2, companyId: company.id } }),
    prisma.part.create({ data: { partNumber: 'REFR-410A-25', name: 'R-410A Refrigerant 25lb', category: 'HVAC', manufacturer: 'Chemours', cost: 125, price: 300, quantityOnHand: 8, reorderLevel: 3, companyId: company.id } }),
    prisma.part.create({ data: { partNumber: 'VALVE-1/2', name: '1/2" Ball Valve', category: 'Plumbing', manufacturer: 'SharkBite', cost: 8, price: 25, quantityOnHand: 30, reorderLevel: 10, companyId: company.id } }),
    prisma.part.create({ data: { partNumber: 'VALVE-3/4', name: '3/4" Ball Valve', category: 'Plumbing', manufacturer: 'SharkBite', cost: 10, price: 30, quantityOnHand: 25, reorderLevel: 10, companyId: company.id } }),
  ])

  console.log('Created 10 parts')

  // Create Customers and Properties
  const customersData = [
    { firstName: 'John', lastName: 'Smith', type: 'RESIDENTIAL', phone: '(555) 200-0001', email: 'john.smith@email.com', address: '100 Oak Street', city: 'Atlanta', state: 'GA', zip: '30301' },
    { firstName: 'Sarah', lastName: 'Johnson', type: 'RESIDENTIAL', phone: '(555) 200-0002', email: 'sarah.j@email.com', address: '200 Maple Ave', city: 'Atlanta', state: 'GA', zip: '30302' },
    { firstName: 'Michael', lastName: 'Williams', type: 'RESIDENTIAL', phone: '(555) 200-0003', email: 'mwilliams@email.com', address: '300 Pine Road', city: 'Atlanta', state: 'GA', zip: '30303' },
    { firstName: 'Emily', lastName: 'Brown', type: 'RESIDENTIAL', phone: '(555) 200-0004', email: 'ebrown@email.com', address: '400 Elm Street', city: 'Atlanta', state: 'GA', zip: '30304' },
    { firstName: 'David', lastName: 'Jones', type: 'RESIDENTIAL', phone: '(555) 200-0005', email: 'djones@email.com', address: '500 Cedar Lane', city: 'Atlanta', state: 'GA', zip: '30305' },
    { firstName: 'Jennifer', lastName: 'Garcia', type: 'RESIDENTIAL', phone: '(555) 200-0006', email: 'jgarcia@email.com', address: '600 Birch Blvd', city: 'Atlanta', state: 'GA', zip: '30306' },
    { firstName: 'Robert', lastName: 'Miller', type: 'RESIDENTIAL', phone: '(555) 200-0007', email: 'rmiller@email.com', address: '700 Walnut Way', city: 'Atlanta', state: 'GA', zip: '30307' },
    { firstName: 'Lisa', lastName: 'Davis', type: 'RESIDENTIAL', phone: '(555) 200-0008', email: 'ldavis@email.com', address: '800 Cherry Circle', city: 'Atlanta', state: 'GA', zip: '30308' },
    { companyName: 'ABC Office Building', type: 'COMMERCIAL', phone: '(555) 200-0009', email: 'facilities@abcoffice.com', address: '1000 Business Park Dr', city: 'Atlanta', state: 'GA', zip: '30309' },
    { companyName: 'XYZ Property Management', type: 'PROPERTY_MANAGEMENT', phone: '(555) 200-0010', email: 'maint@xyzpm.com', address: '2000 Management Lane', city: 'Atlanta', state: 'GA', zip: '30310' },
  ]

  const customers = []
  for (let i = 0; i < customersData.length; i++) {
    const c = customersData[i]
    const customer = await prisma.customer.create({
      data: {
        customerNumber: `CUS-${(i + 1).toString().padStart(5, '0')}`,
        type: c.type as 'RESIDENTIAL' | 'COMMERCIAL' | 'PROPERTY_MANAGEMENT',
        status: 'ACTIVE',
        firstName: c.firstName,
        lastName: c.lastName,
        companyName: c.companyName,
        email: c.email,
        phone: c.phone,
        billingAddress: c.address,
        billingCity: c.city,
        billingState: c.state,
        billingZip: c.zip,
        companyId: company.id,
      },
    })

    // Create property for each customer
    const property = await prisma.property.create({
      data: {
        name: 'Primary',
        type: c.type === 'COMMERCIAL' ? 'Office' : 'House',
        address: c.address,
        city: c.city,
        state: c.state,
        zip: c.zip,
        customerId: customer.id,
      },
    })

    // Create equipment for first 5 customers
    if (i < 5) {
      await prisma.equipment.create({
        data: {
          type: 'AC_UNIT',
          brand: 'Carrier',
          model: '24ACC636A003',
          serialNumber: `AC${2020 + i}${(i + 1).toString().padStart(6, '0')}`,
          installDate: new Date(2020 + i, 5, 15),
          warrantyExpires: new Date(2030 + i, 5, 15),
          location: 'Backyard',
          propertyId: property.id,
        },
      })

      await prisma.equipment.create({
        data: {
          type: 'FURNACE',
          brand: 'Trane',
          model: 'XR95',
          serialNumber: `FUR${2020 + i}${(i + 1).toString().padStart(6, '0')}`,
          installDate: new Date(2020 + i, 5, 15),
          warrantyExpires: new Date(2030 + i, 5, 15),
          location: 'Basement',
          propertyId: property.id,
        },
      })
    }

    customers.push({ customer, property })
  }

  console.log('Created 10 customers with properties and equipment')

  // Create Jobs
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset to start of day

  const jobStatuses = ['PENDING', 'SCHEDULED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED']
  const priorities = ['NORMAL', 'NORMAL', 'HIGH', 'NORMAL', 'LOW', 'EMERGENCY']
  const tradeTypes = ['HVAC', 'PLUMBING', 'HVAC', 'ELECTRICAL', 'HVAC', 'PLUMBING']
  const titles = [
    'AC not cooling properly',
    'Leaky faucet in bathroom',
    'Annual maintenance tune-up',
    'Outlet not working in bedroom',
    'Strange noise from furnace',
    'Water heater not heating',
  ]

  for (let i = 0; i < 15; i++) {
    const customerData = customers[i % customers.length]
    const status = jobStatuses[i % jobStatuses.length]
    const scheduledDate = new Date(today)
    scheduledDate.setDate(today.getDate() + (i % 7) - 3) // Jobs from 3 days ago to 3 days from now
    scheduledDate.setHours(8 + (i % 8), 0, 0, 0)

    const job = await prisma.job.create({
      data: {
        jobNumber: `JOB-${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}-${(i + 1).toString().padStart(4, '0')}`,
        status: status as 'PENDING' | 'SCHEDULED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED',
        priority: priorities[i % priorities.length] as 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY',
        type: 'SERVICE_CALL',
        tradeType: tradeTypes[i % tradeTypes.length] as 'HVAC' | 'PLUMBING' | 'ELECTRICAL',
        title: titles[i % titles.length],
        description: `Customer reported: ${titles[i % titles.length]}. Need service call to diagnose and repair.`,
        scheduledStart: scheduledDate,
        estimatedDuration: 90 + (i % 4) * 30,
        timeWindowStart: `${8 + (i % 4) * 2}:00 AM`,
        timeWindowEnd: `${10 + (i % 4) * 2}:00 AM`,
        companyId: company.id,
        customerId: customerData.customer.id,
        propertyId: customerData.property.id,
        createdById: admin.id,
        serviceTypeId: serviceTypes[i % serviceTypes.length].id,
        completedAt: status === 'COMPLETED' ? new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000) : null,
        actualAmount: status === 'COMPLETED' ? 150 + (i * 75) + Math.floor(Math.random() * 100) : null,
        estimatedAmount: 150 + (i * 50),
      },
    })

    // Assign technician to scheduled, dispatched, in_progress, and completed jobs
    if (['SCHEDULED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      const techs = [technicianTom, technicianChris, technicianDave]
      await prisma.jobAssignment.create({
        data: {
          jobId: job.id,
          technicianId: techs[i % techs.length].id,
          isPrimary: true,
        },
      })
    }
  }

  console.log('Created 15 jobs with assignments')

  // Create additional jobs specifically for TODAY to show in dispatch board
  const todayJobs = [
    { title: 'AC unit making loud noise', tradeType: 'HVAC', priority: 'HIGH', status: 'SCHEDULED', hour: 9, techIdx: 0 },
    { title: 'Bathroom sink clogged', tradeType: 'PLUMBING', priority: 'NORMAL', status: 'SCHEDULED', hour: 10, techIdx: 1 },
    { title: 'Thermostat replacement', tradeType: 'HVAC', priority: 'NORMAL', status: 'DISPATCHED', hour: 11, techIdx: 0 },
    { title: 'Water heater inspection', tradeType: 'PLUMBING', priority: 'LOW', status: 'IN_PROGRESS', hour: 8, techIdx: 1 },
    { title: 'Electrical panel check', tradeType: 'ELECTRICAL', priority: 'NORMAL', status: 'SCHEDULED', hour: 14, techIdx: 2 },
    { title: 'Furnace maintenance', tradeType: 'HVAC', priority: 'NORMAL', status: 'SCHEDULED', hour: 15, techIdx: 2 },
  ]

  const techs = [technicianTom, technicianChris, technicianDave]

  for (let i = 0; i < todayJobs.length; i++) {
    const jobData = todayJobs[i]
    const customerData = customers[i % customers.length]
    const scheduledDate = new Date(today)
    scheduledDate.setHours(jobData.hour, 0, 0, 0)

    const job = await prisma.job.create({
      data: {
        jobNumber: `JOB-${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}-${(100 + i).toString().padStart(4, '0')}`,
        status: jobData.status as 'SCHEDULED' | 'DISPATCHED' | 'IN_PROGRESS',
        priority: jobData.priority as 'LOW' | 'NORMAL' | 'HIGH',
        type: 'SERVICE_CALL',
        tradeType: jobData.tradeType as 'HVAC' | 'PLUMBING' | 'ELECTRICAL',
        title: jobData.title,
        description: `Customer needs: ${jobData.title}`,
        scheduledStart: scheduledDate,
        estimatedDuration: 90,
        timeWindowStart: `${jobData.hour}:00 AM`,
        timeWindowEnd: `${jobData.hour + 2}:00 AM`,
        companyId: company.id,
        customerId: customerData.customer.id,
        propertyId: customerData.property.id,
        createdById: admin.id,
        serviceTypeId: serviceTypes[i % serviceTypes.length].id,
      },
    })

    // Assign to technician
    await prisma.jobAssignment.create({
      data: {
        jobId: job.id,
        technicianId: techs[jobData.techIdx].id,
        isPrimary: true,
      },
    })
  }

  console.log('Created 6 additional jobs for today\'s dispatch board')

  // Create some unassigned jobs for dispatch (PENDING status, no assignments)
  const unassignedJobs = [
    { title: 'Emergency: No hot water', tradeType: 'PLUMBING', priority: 'EMERGENCY', hour: 10 },
    { title: 'AC blowing warm air', tradeType: 'HVAC', priority: 'HIGH', hour: 13 },
    { title: 'Garbage disposal repair', tradeType: 'PLUMBING', priority: 'NORMAL', hour: 14 },
    { title: 'Outdoor outlet not working', tradeType: 'ELECTRICAL', priority: 'LOW', hour: 16 },
  ]

  for (let i = 0; i < unassignedJobs.length; i++) {
    const jobData = unassignedJobs[i]
    const customerData = customers[(i + 5) % customers.length]
    const scheduledDate = new Date(today)
    scheduledDate.setHours(jobData.hour, 0, 0, 0)

    await prisma.job.create({
      data: {
        jobNumber: `JOB-${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}-${(200 + i).toString().padStart(4, '0')}`,
        status: 'PENDING',
        priority: jobData.priority as 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY',
        type: 'SERVICE_CALL',
        tradeType: jobData.tradeType as 'HVAC' | 'PLUMBING' | 'ELECTRICAL',
        title: jobData.title,
        description: `Customer needs: ${jobData.title}`,
        scheduledStart: scheduledDate,
        estimatedDuration: 60,
        timeWindowStart: `${jobData.hour}:00`,
        timeWindowEnd: `${jobData.hour + 2}:00`,
        companyId: company.id,
        customerId: customerData.customer.id,
        propertyId: customerData.property.id,
        createdById: admin.id,
      },
    })
  }

  console.log('Created 4 unassigned jobs for dispatch queue')

  // Create additional completed jobs for reports (spread over last 60 days)
  const completedJobTitles = [
    'AC repair completed',
    'Furnace maintenance done',
    'Plumbing leak fixed',
    'Water heater serviced',
    'Electrical panel inspection',
    'Thermostat replacement',
    'Duct cleaning completed',
    'Drain cleaning service',
  ]

  for (let i = 0; i < 20; i++) {
    const customerData = customers[i % customers.length]
    const completedDate = new Date(today)
    completedDate.setDate(today.getDate() - (i * 3) - 1) // Spread over last 60 days
    completedDate.setHours(10 + (i % 6), 0, 0, 0)

    const job = await prisma.job.create({
      data: {
        jobNumber: `JOB-${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}-${(300 + i).toString().padStart(4, '0')}`,
        status: 'COMPLETED',
        priority: ['NORMAL', 'HIGH', 'LOW'][i % 3] as 'LOW' | 'NORMAL' | 'HIGH',
        type: 'SERVICE_CALL',
        tradeType: ['HVAC', 'PLUMBING', 'ELECTRICAL'][i % 3] as 'HVAC' | 'PLUMBING' | 'ELECTRICAL',
        title: completedJobTitles[i % completedJobTitles.length],
        description: `Completed: ${completedJobTitles[i % completedJobTitles.length]}`,
        scheduledStart: completedDate,
        estimatedDuration: 60 + (i % 4) * 30,
        companyId: company.id,
        customerId: customerData.customer.id,
        propertyId: customerData.property.id,
        createdById: admin.id,
        serviceTypeId: serviceTypes[i % serviceTypes.length].id,
        completedAt: new Date(completedDate.getTime() + 2 * 60 * 60 * 1000),
        actualAmount: 200 + (i * 50) + Math.floor(Math.random() * 150),
        estimatedAmount: 175 + (i * 45),
      },
    })

    // Assign to technician
    await prisma.jobAssignment.create({
      data: {
        jobId: job.id,
        technicianId: techs[i % techs.length].id,
        isPrimary: true,
      },
    })
  }

  console.log('Created 20 additional completed jobs for reports')

  // Create Service Agreements (15+ items)
  const agreementStatuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'PENDING', 'EXPIRED']
  const plans = [bronzePlan, silverPlan, goldPlan]

  for (let i = 0; i < 18; i++) {
    const customerData = customers[i % customers.length]
    const startDate = new Date(today)
    startDate.setMonth(today.getMonth() - (i * 2))
    const endDate = new Date(startDate)
    endDate.setFullYear(startDate.getFullYear() + 1)
    const status = agreementStatuses[i % agreementStatuses.length]

    await prisma.serviceAgreement.create({
      data: {
        agreementNumber: `AGR-${today.getFullYear()}-${(i + 1).toString().padStart(4, '0')}`,
        status: status as 'ACTIVE' | 'PENDING' | 'EXPIRED',
        startDate,
        endDate,
        renewalDate: endDate,
        billingFrequency: i % 2 === 0 ? 'monthly' : 'annual',
        autoRenew: status === 'ACTIVE',
        visitsUsed: i % 3,
        lastVisitDate: i > 5 ? new Date(today.getTime() - (i * 7 * 24 * 60 * 60 * 1000)) : null,
        customerId: customerData.customer.id,
        planId: plans[i % plans.length].id,
      },
    })
  }

  console.log('Created 18 service agreements')

  // Create Pricebook Items
  const pricebookItems = [
    { code: 'SVC-DIAG', name: 'Diagnostic Fee', category: 'Labor', type: 'Flat Rate', unitPrice: 89, laborMinutes: 30 },
    { code: 'SVC-HOUR', name: 'Labor - Per Hour', category: 'Labor', type: 'Per Hour', unitPrice: 125, laborMinutes: 60 },
    { code: 'SVC-TUNE-HVAC', name: 'HVAC Tune-Up', category: 'Labor', type: 'Flat Rate', unitPrice: 149, laborMinutes: 60 },
    { code: 'SVC-TUNE-PLMB', name: 'Plumbing Inspection', category: 'Labor', type: 'Flat Rate', unitPrice: 99, laborMinutes: 45 },
    { code: 'INST-AC-3TON', name: '3 Ton AC Unit Installation', category: 'Equipment', type: 'Flat Rate', unitPrice: 4500, unitCost: 2500 },
    { code: 'INST-FURN-80', name: '80% Furnace Installation', category: 'Equipment', type: 'Flat Rate', unitPrice: 3200, unitCost: 1800 },
    { code: 'INST-WH-50', name: '50 Gal Water Heater Install', category: 'Equipment', type: 'Flat Rate', unitPrice: 1800, unitCost: 900 },
    { code: 'REP-CAP', name: 'Capacitor Replacement', category: 'Labor', type: 'Flat Rate', unitPrice: 225, laborMinutes: 30 },
    { code: 'REP-CONT', name: 'Contactor Replacement', category: 'Labor', type: 'Flat Rate', unitPrice: 275, laborMinutes: 45 },
    { code: 'REP-BLOWER', name: 'Blower Motor Replacement', category: 'Labor', type: 'Flat Rate', unitPrice: 650, laborMinutes: 90 },
  ]

  for (const item of pricebookItems) {
    await prisma.pricebookItem.create({
      data: {
        ...item,
        isActive: true,
        isTaxable: true,
        companyId: company.id,
      },
    })
  }

  console.log('Created 10 pricebook items')

  // Create additional Technicians (total 6)
  const techJessica = await prisma.user.create({
    data: {
      email: 'jessica@comfortpro.com',
      password: passwordHash,
      firstName: 'Jessica',
      lastName: 'Taylor',
      phone: '(555) 100-0007',
      role: 'TECHNICIAN',
      companyId: company.id,
    },
  })

  const techMike = await prisma.user.create({
    data: {
      email: 'mike.r@comfortpro.com',
      password: passwordHash,
      firstName: 'Mike',
      lastName: 'Rodriguez',
      phone: '(555) 100-0008',
      role: 'TECHNICIAN',
      companyId: company.id,
    },
  })

  const techAlex = await prisma.user.create({
    data: {
      email: 'alex@comfortpro.com',
      password: passwordHash,
      firstName: 'Alex',
      lastName: 'Thompson',
      phone: '(555) 100-0009',
      role: 'TECHNICIAN',
      companyId: company.id,
    },
  })

  await prisma.technician.create({
    data: {
      userId: techJessica.id,
      employeeId: 'EMP-004',
      color: '#EC4899',
      tradeTypes: ['HVAC', 'PLUMBING'],
      certifications: ['EPA 608 Universal', 'Master Plumber'],
      payType: 'HOURLY',
      hourlyRate: 36,
      status: 'AVAILABLE',
    },
  })

  await prisma.technician.create({
    data: {
      userId: techMike.id,
      employeeId: 'EMP-005',
      color: '#8B5CF6',
      tradeTypes: ['ELECTRICAL'],
      certifications: ['Master Electrician', 'Solar Certified'],
      payType: 'HOURLY',
      hourlyRate: 40,
      status: 'ON_JOB',
    },
  })

  await prisma.technician.create({
    data: {
      userId: techAlex.id,
      employeeId: 'EMP-006',
      color: '#06B6D4',
      tradeTypes: ['HVAC', 'ELECTRICAL'],
      certifications: ['NATE Certified', 'Journeyman Electrician'],
      payType: 'COMMISSION',
      commissionPct: 20,
      status: 'AVAILABLE',
    },
  })

  console.log('Created 3 additional technicians (total 6)')

  // Create additional inventory/parts (15+ items)
  const additionalParts = [
    { partNumber: 'MOTOR-COND', name: 'Condenser Fan Motor', category: 'HVAC', manufacturer: 'US Motors', cost: 85, price: 225, quantityOnHand: 8, reorderLevel: 3 },
    { partNumber: 'MOTOR-BLOW', name: 'Blower Motor 1/2HP', category: 'HVAC', manufacturer: 'Nidec', cost: 120, price: 350, quantityOnHand: 5, reorderLevel: 2 },
    { partNumber: 'COMP-3TON', name: '3 Ton Compressor', category: 'HVAC', manufacturer: 'Copeland', cost: 650, price: 1200, quantityOnHand: 2, reorderLevel: 1 },
    { partNumber: 'COIL-EVAP', name: 'Evaporator Coil', category: 'HVAC', manufacturer: 'Carrier', cost: 400, price: 850, quantityOnHand: 3, reorderLevel: 1 },
    { partNumber: 'VALVE-TXV', name: 'TXV Valve', category: 'HVAC', manufacturer: 'Sporlan', cost: 75, price: 175, quantityOnHand: 6, reorderLevel: 2 },
    { partNumber: 'PIPE-CU-1/2', name: '1/2" Copper Pipe 10ft', category: 'Plumbing', manufacturer: 'Mueller', cost: 15, price: 35, quantityOnHand: 25, reorderLevel: 10 },
    { partNumber: 'PIPE-CU-3/4', name: '3/4" Copper Pipe 10ft', category: 'Plumbing', manufacturer: 'Mueller', cost: 20, price: 45, quantityOnHand: 20, reorderLevel: 10 },
    { partNumber: 'WH-50-GAS', name: '50 Gal Gas Water Heater', category: 'Plumbing', manufacturer: 'Rheem', cost: 450, price: 950, quantityOnHand: 3, reorderLevel: 1 },
    { partNumber: 'DISP-1/2HP', name: 'Garbage Disposal 1/2HP', category: 'Plumbing', manufacturer: 'InSinkErator', cost: 85, price: 225, quantityOnHand: 4, reorderLevel: 2 },
    { partNumber: 'FAUCET-KIT', name: 'Kitchen Faucet', category: 'Plumbing', manufacturer: 'Delta', cost: 65, price: 175, quantityOnHand: 6, reorderLevel: 2 },
    { partNumber: 'OUTLET-20A', name: '20A Outlet', category: 'Electrical', manufacturer: 'Leviton', cost: 5, price: 15, quantityOnHand: 50, reorderLevel: 20 },
    { partNumber: 'SWITCH-DIM', name: 'Dimmer Switch', category: 'Electrical', manufacturer: 'Lutron', cost: 25, price: 65, quantityOnHand: 15, reorderLevel: 5 },
    { partNumber: 'PANEL-200A', name: '200A Main Panel', category: 'Electrical', manufacturer: 'Square D', cost: 250, price: 550, quantityOnHand: 2, reorderLevel: 1 },
    { partNumber: 'BREAK-20A', name: '20A Circuit Breaker', category: 'Electrical', manufacturer: 'Square D', cost: 8, price: 25, quantityOnHand: 30, reorderLevel: 10 },
    { partNumber: 'WIRE-12-2', name: '12/2 Romex 250ft', category: 'Electrical', manufacturer: 'Southwire', cost: 85, price: 165, quantityOnHand: 10, reorderLevel: 3 },
  ]

  for (const part of additionalParts) {
    await prisma.part.create({
      data: {
        ...part,
        companyId: company.id,
      },
    })
  }

  console.log('Created 15 additional parts (total 25 inventory items)')

  // Create Estimates (18 items)
  const estimateStatuses = ['DRAFT', 'SENT', 'VIEWED', 'APPROVED', 'DECLINED', 'EXPIRED']
  const estimateTitles = [
    'AC System Replacement',
    'Furnace Installation',
    'Water Heater Replacement',
    'Electrical Panel Upgrade',
    'Bathroom Remodel Plumbing',
    'Kitchen Plumbing Update',
  ]

  for (let i = 0; i < 18; i++) {
    const customerData = customers[i % customers.length]
    const status = estimateStatuses[i % estimateStatuses.length]
    const createdDate = new Date(today)
    createdDate.setDate(today.getDate() - (i * 3))
    const expirationDate = new Date(createdDate)
    expirationDate.setDate(createdDate.getDate() + 30)

    const goodPrice = 1500 + (i * 200)
    const betterPrice = goodPrice * 1.3
    const bestPrice = goodPrice * 1.6

    const estimate = await prisma.estimate.create({
      data: {
        estimateNumber: `EST-${today.getFullYear()}-${(i + 1).toString().padStart(4, '0')}`,
        status: status as 'DRAFT' | 'SENT' | 'VIEWED' | 'APPROVED' | 'DECLINED' | 'EXPIRED',
        createdDate,
        expirationDate,
        approvedAt: status === 'APPROVED' ? new Date(createdDate.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
        selectedOption: status === 'APPROVED' ? ['good', 'better', 'best'][i % 3] : null,
        subtotal: bestPrice,
        taxAmount: bestPrice * 0.08,
        totalAmount: bestPrice * 1.08,
        notes: `Estimate for ${estimateTitles[i % estimateTitles.length]}`,
        customerId: customerData.customer.id,
      },
    })

    // Create options for each estimate
    const options = [
      { name: 'Good', price: goodPrice, recommended: false },
      { name: 'Better', price: betterPrice, recommended: true },
      { name: 'Best', price: bestPrice, recommended: false },
    ]

    for (let j = 0; j < options.length; j++) {
      const opt = options[j]
      const taxAmt = opt.price * 0.08

      await prisma.estimateOption.create({
        data: {
          name: opt.name,
          description: `${opt.name} option for ${estimateTitles[i % estimateTitles.length]}`,
          sortOrder: j,
          subtotal: opt.price,
          taxAmount: taxAmt,
          totalAmount: opt.price + taxAmt,
          isRecommended: opt.recommended,
          estimateId: estimate.id,
        },
      })
    }
  }

  console.log('Created 18 estimates with options')

  // Create Invoices (25 items with more PAID for reports)
  // More PAID invoices to show revenue in reports
  const invoiceStatuses = ['PAID', 'PAID', 'PAID', 'PAID', 'PAID', 'PARTIAL', 'SENT', 'DRAFT', 'OVERDUE']

  for (let i = 0; i < 25; i++) {
    const customerData = customers[i % customers.length]
    const status = invoiceStatuses[i % invoiceStatuses.length]
    const issueDate = new Date(today)
    issueDate.setDate(today.getDate() - (i * 3)) // Spread over ~75 days
    const dueDate = new Date(issueDate)
    dueDate.setDate(issueDate.getDate() + 30)

    // Paid date within last few days for recent paid invoices
    const paidDate = status === 'PAID' || status === 'PARTIAL'
      ? new Date(issueDate.getTime() + (2 + Math.floor(Math.random() * 5)) * 24 * 60 * 60 * 1000)
      : null

    const subtotal = 250 + (i * 175) + Math.floor(Math.random() * 200)
    const taxAmount = subtotal * 0.08
    const totalAmount = subtotal + taxAmount
    const paidAmount = status === 'PAID' ? totalAmount : status === 'PARTIAL' ? totalAmount * 0.5 : 0

    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${today.getFullYear()}-${(i + 1).toString().padStart(4, '0')}`,
        status: status as 'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIAL' | 'PAID' | 'OVERDUE',
        issueDate,
        dueDate,
        paidDate,
        subtotal,
        taxRate: 0.08,
        taxAmount,
        totalAmount,
        paidAmount,
        balanceDue: totalAmount - paidAmount,
        notes: `Invoice for service call`,
        customerId: customerData.customer.id,
      },
    })
  }

  console.log('Created 25 invoices')

  // Create Payments for paid invoices (for reports)
  const paidInvoices = await prisma.invoice.findMany({
    where: { status: { in: ['PAID', 'PARTIAL'] } },
  })

  for (const invoice of paidInvoices) {
    await prisma.payment.create({
      data: {
        amount: invoice.paidAmount,
        method: ['CREDIT_CARD', 'CHECK', 'CASH', 'ACH'][Math.floor(Math.random() * 4)] as 'CREDIT_CARD' | 'CHECK' | 'CASH' | 'ACH',
        date: invoice.paidDate || new Date(),
        reference: `PAY-${invoice.invoiceNumber}`,
        invoiceId: invoice.id,
      },
    })
  }

  console.log('Created payments for paid invoices')

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
