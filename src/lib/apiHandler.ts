import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { Prisma } from '@prisma/client'

interface AuthUser {
  id: string
  email: string
  role: string
  companyId: string
  technicianId?: string
}

type ApiHandler = (
  request: NextRequest,
  user: AuthUser,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>

export function apiHandler(handler: ApiHandler) {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      const user = await getAuthUser(request)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      return await handler(request, user, context)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return NextResponse.json({ error: 'Record not found' }, { status: 404 })
        }
        if (error.code === 'P2002') {
          return NextResponse.json({ error: 'A record with this value already exists' }, { status: 409 })
        }
        if (error.code === 'P2003') {
          return NextResponse.json({ error: 'Cannot delete: related records exist' }, { status: 409 })
        }
      }

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
