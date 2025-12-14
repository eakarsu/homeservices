import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/sms'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const technician = await prisma.technician.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    })

    if (!technician) {
      return NextResponse.json(
        { error: 'Technician not found' },
        { status: 404 }
      )
    }

    if (!technician.user.phone) {
      return NextResponse.json(
        { error: 'Technician has no phone number' },
        { status: 400 }
      )
    }

    const result = await sendSMS(technician.user.phone, message)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Message sent to ${technician.user.firstName}`,
    })
  } catch (error) {
    console.error('Error sending message to technician:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
