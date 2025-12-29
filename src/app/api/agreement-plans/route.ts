import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/apiAuth"
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plans = await prisma.agreementPlan.findMany({
      where: {
        companyId: user.companyId,
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
