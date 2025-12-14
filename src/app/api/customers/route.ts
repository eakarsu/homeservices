import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCustomerNumber } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {
      companyId: session.user.companyId,
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { customerNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          properties: {
            select: { id: true },
          },
          jobs: {
            select: { id: true },
          },
          invoices: {
            where: { status: 'PAID' },
            select: { totalAmount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ])

    const data = customers.map((customer) => ({
      ...customer,
      propertyCount: customer.properties.length,
      jobCount: customer.jobs.length,
      totalSpent: customer.invoices.reduce(
        (sum, inv) => sum + Number(inv.totalAmount),
        0
      ),
      properties: undefined,
      jobs: undefined,
      invoices: undefined,
    }))

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Customers list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Create customer with property in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          customerNumber: generateCustomerNumber(),
          companyId: session.user.companyId,
          type: body.type || 'RESIDENTIAL',
          status: body.status || 'ACTIVE',
          firstName: body.firstName,
          lastName: body.lastName,
          companyName: body.companyName,
          email: body.email,
          phone: body.phone,
          mobile: body.mobile,
          preferredContact: body.preferredContact || 'phone',
          billingAddress: body.billingAddress,
          billingCity: body.billingCity,
          billingState: body.billingState,
          billingZip: body.billingZip,
          referralSource: body.referralSource || body.source,
          referredBy: body.referredBy,
          doNotCall: body.doNotCall || false,
          doNotEmail: body.doNotEmail || false,
          doNotText: body.doNotText || false,
          notes: body.notes,
          tags: body.tags || [],
        },
      })

      // Create property if address is provided
      if (body.propertyAddress) {
        await tx.property.create({
          data: {
            customerId: customer.id,
            name: 'Primary Property',
            type: body.propertyType || 'House',
            address: body.propertyAddress,
            city: body.propertyCity,
            state: body.propertyState,
            zip: body.propertyZip,
          },
        })
      }

      return customer
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
