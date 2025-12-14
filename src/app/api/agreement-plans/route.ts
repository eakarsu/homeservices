import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plans = await prisma.agreementPlan.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
      },
      orderBy: [
        { tradeType: 'asc' },
        { monthlyPrice: 'asc' },
      ],
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Get agreement plans error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
