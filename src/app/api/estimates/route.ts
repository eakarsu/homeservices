import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'

import { prisma } from '@/lib/prisma'
import { generateEstimateNumber } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {
      customer: {
        companyId: user.companyId,
      },
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { estimateNumber: { contains: search, mode: 'insensitive' } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [rawEstimates, total] = await Promise.all([
      prisma.estimate.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
            },
          },
          job: {
            select: {
              id: true,
              jobNumber: true,
              title: true,
            },
          },
          options: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.estimate.count({ where }),
    ])

    // Calculate Good/Better/Best totals from options
    const estimates = rawEstimates.map(estimate => {
      const options = estimate.options || []
      return {
        ...estimate,
        goodTotal: options[0]?.totalAmount || 0,
        betterTotal: options[1]?.totalAmount || 0,
        bestTotal: options[2]?.totalAmount || 0,
      }
    })

    return NextResponse.json({
      estimates,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Estimates list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Calculate totals from options
    let selectedOptionTotal = 0
    if (body.options && body.options.length > 0) {
      const recommendedOption = body.options.find((o: { isRecommended: boolean }) => o.isRecommended) || body.options[0]
      selectedOptionTotal = recommendedOption.totalAmount || 0
    }

    const estimate = await prisma.estimate.create({
      data: {
        estimateNumber: generateEstimateNumber(),
        customerId: body.customerId,
        jobId: body.jobId,
        status: body.status || 'DRAFT',
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: selectedOptionTotal * 0.9, // Assume 10% tax
        taxAmount: selectedOptionTotal * 0.1,
        totalAmount: selectedOptionTotal,
        notes: body.notes,
        terms: body.terms,
        options: body.options ? {
          create: body.options.map((opt: {
            name: string
            description?: string
            sortOrder: number
            subtotal: number
            taxAmount: number
            totalAmount: number
            isRecommended: boolean
            lineItems?: {
              description: string
              quantity: number
              unitPrice: number
              totalPrice: number
              category?: string
              sortOrder: number
              isOptional: boolean
            }[]
          }, idx: number) => ({
            name: opt.name,
            description: opt.description,
            sortOrder: idx,
            subtotal: opt.subtotal || 0,
            taxAmount: opt.taxAmount || 0,
            totalAmount: opt.totalAmount || 0,
            isRecommended: opt.isRecommended || false,
            lineItems: opt.lineItems ? {
              create: opt.lineItems.map((item: {
                description: string
                quantity: number
                unitPrice: number
                totalPrice: number
                category?: string
                sortOrder: number
                isOptional: boolean
              }, itemIdx: number) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                category: item.category,
                sortOrder: itemIdx,
                isOptional: item.isOptional || false,
              })),
            } : undefined,
          })),
        } : undefined,
      },
      include: {
        customer: true,
        options: {
          include: {
            lineItems: true,
          },
        },
      },
    })

    return NextResponse.json(estimate, { status: 201 })
  } catch (error) {
    console.error('Create estimate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
