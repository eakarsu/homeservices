import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {
      customer: {
        companyId: session.user.companyId,
      },
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { agreementNumber: { contains: search, mode: 'insensitive' } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const agreements = await prisma.serviceAgreement.findMany({
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
        plan: {
          select: {
            id: true,
            name: true,
            monthlyPrice: true,
            annualPrice: true,
            visitsIncluded: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ agreements })
  } catch (error) {
    console.error('Agreements list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const agreementNumber = `AGR-${Date.now().toString().slice(-8)}`

    const agreement = await prisma.serviceAgreement.create({
      data: {
        agreementNumber,
        customerId: data.customerId,
        planId: data.planId,
        status: data.status || 'ACTIVE',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        billingFrequency: data.billingFrequency || 'monthly',
        autoRenew: data.autoRenew ?? true,
        notes: data.notes,
      },
      include: {
        customer: true,
        plan: true,
      },
    })

    return NextResponse.json(agreement, { status: 201 })
  } catch (error) {
    console.error('Create agreement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
