import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        customer: {
          companyId: session.user.companyId,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
            billingAddress: true,
            billingCity: true,
            billingState: true,
            billingZip: true,
          },
        },
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
          },
        },
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Get invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const existing = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        customer: {
          companyId: session.user.companyId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (data.status !== undefined) updateData.status = data.status
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate)
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.terms !== undefined) updateData.terms = data.terms

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Update invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        customer: {
          companyId: session.user.companyId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
