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

    const estimate = await prisma.estimate.findFirst({
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
          include: {
            lineItems: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    })

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    return NextResponse.json(estimate)
  } catch (error) {
    console.error('Get estimate error:', error)
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

    const existing = await prisma.estimate.findFirst({
      where: {
        id: params.id,
        customer: {
          companyId: session.user.companyId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (data.status !== undefined) {
      updateData.status = data.status
      if (data.status === 'APPROVED') {
        updateData.approvedAt = new Date()
      }
    }
    if (data.selectedOption !== undefined) updateData.selectedOption = data.selectedOption
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.terms !== undefined) updateData.terms = data.terms

    const estimate = await prisma.estimate.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(estimate)
  } catch (error) {
    console.error('Update estimate error:', error)
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

    const existing = await prisma.estimate.findFirst({
      where: {
        id: params.id,
        customer: {
          companyId: session.user.companyId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    await prisma.estimate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete estimate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
