import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addYears } from 'date-fns'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current agreement
    const agreement = await prisma.serviceAgreement.findFirst({
      where: {
        id: params.id,
        customer: { companyId: session.user.companyId }
      },
      include: { plan: true }
    })

    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
    }

    // Calculate new dates based on billing frequency
    const currentEndDate = new Date(agreement.endDate)
    const newStartDate = currentEndDate
    const newEndDate = agreement.billingFrequency === 'monthly'
      ? new Date(currentEndDate.setMonth(currentEndDate.getMonth() + 1))
      : addYears(currentEndDate, 1)

    // Update agreement
    const updatedAgreement = await prisma.serviceAgreement.update({
      where: { id: params.id },
      data: {
        status: 'ACTIVE',
        startDate: newStartDate,
        endDate: newEndDate,
        renewalDate: new Date(),
        visitsUsed: 0, // Reset visits for new period
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        plan: true,
      }
    })

    return NextResponse.json(updatedAgreement)
  } catch (error) {
    console.error('Renew agreement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
