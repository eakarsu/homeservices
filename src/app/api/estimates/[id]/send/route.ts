import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/apiAuth"
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the estimate with customer info
    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
      },
    })

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Update estimate status to SENT
    const updatedEstimate = await prisma.estimate.update({
      where: { id },
      data: {
        status: 'SENT',
      },
    })

    // In a real app, you would send an email here
    // For now, we just update the status
    // Example email sending logic would go here:
    // await sendEmail({
    //   to: estimate.customer.email,
    //   subject: `Estimate ${estimate.estimateNumber} from Comfort Pro`,
    //   template: 'estimate',
    //   data: { estimate, customer: estimate.customer }
    // })

    return NextResponse.json({
      success: true,
      message: 'Estimate sent successfully',
      estimate: updatedEstimate,
    })
  } catch (error) {
    console.error('Send estimate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
