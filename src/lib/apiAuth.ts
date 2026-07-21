import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { getAuthSigningSecret, validateRuntimeConfig } from '@/lib/runtime-config'

interface AuthUser {
  id: string
  email: string
  role: string
  companyId: string
  technicianId?: string
}

/**
 * Gets authenticated user from either NextAuth session (web) or JWT Bearer token (mobile)
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  validateRuntimeConfig()
  // First try NextAuth session (for web users)
  const session = await getServerSession(authOptions)
  if (session?.user) {
    const currentUser = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        companyId: session.user.companyId,
        isActive: true,
      },
      include: { technician: { select: { id: true } } },
    })
    if (!currentUser) return null
    return {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      companyId: currentUser.companyId,
      technicianId: currentUser.technician?.id,
    }
  }

  // Try Bearer token (for mobile users)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      const decoded = jwt.verify(
        token,
        getAuthSigningSecret(),
        { algorithms: ['HS256'], issuer: 'servicecrew', audience: 'servicecrew-api' }
      ) as { sub: string; email: string; role: string; companyId: string; technicianId?: string }
      const currentUser = await prisma.user.findFirst({
        where: { id: decoded.sub, companyId: decoded.companyId, isActive: true },
        include: { technician: { select: { id: true } } },
      })
      if (!currentUser) return null
      return {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        companyId: currentUser.companyId,
        technicianId: currentUser.technician?.id,
      }
    } catch {
      return null
    }
  }

  return null
}
