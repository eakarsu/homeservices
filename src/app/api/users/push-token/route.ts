import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token, platform } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    // Update user with push token
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pushToken: token,
        pushPlatform: platform || 'ios',
        pushTokenUpdatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push token save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
