import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/apiAuth"
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agreement = await prisma.serviceAgreement.findFirst({
      where: {
        id: params.id,
        customer: { companyId: user.companyId }
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            stripeCustomerId: true,
          }
        },
        plan: true,
      }
    })

    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
    }

    return NextResponse.json(agreement)
  } catch (error) {
    console.error('Get agreement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Verify agreement belongs to company
    const existing = await prisma.serviceAgreement.findFirst({
      where: {
        id: params.id,
        customer: { companyId: user.companyId }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
    }

    const agreement = await prisma.serviceAgreement.update({
      where: { id: params.id },
      data: {
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        renewalDate: data.renewalDate ? new Date(data.renewalDate) : undefined,
        billingFrequency: data.billingFrequency,
        paymentMethod: data.paymentMethod,
        autoRenew: data.autoRenew,
        visitsUsed: data.visitsUsed,
        lastVisitDate: data.lastVisitDate ? new Date(data.lastVisitDate) : undefined,
        nextVisitDue: data.nextVisitDue ? new Date(data.nextVisitDue) : undefined,
        notes: data.notes,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        plan: true,
      }
    })

    return NextResponse.json(agreement)
  } catch (error) {
    console.error('Update agreement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify agreement belongs to company
    const existing = await prisma.serviceAgreement.findFirst({
      where: {
        id: params.id,
        customer: { companyId: user.companyId }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
    }

    await prisma.serviceAgreement.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        cancelledDate: new Date(),
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel agreement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
