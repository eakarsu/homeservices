import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import jwt from 'jsonwebtoken'

interface MobileTokenPayload {
  sub: string  // user id
  email: string
  role: string
  technicianId?: string
  companyId: string
  provider?: string
}

interface AuthenticatedUser {
  id: string
  email: string
  role: string
  technicianId?: string
  companyId: string
}

/**
 * Gets the authenticated user from either NextAuth session (web) or JWT Bearer token (mobile)
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  // First try NextAuth session (for web users)
  const session = await getServerSession(authOptions)
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email!,
      role: session.user.role,
      technicianId: session.user.technicianId,
      companyId: session.user.companyId
    }
  }

  // Try Bearer token (for mobile users)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    try {
      const decoded = jwt.verify(
        token,
        process.env.NEXTAUTH_SECRET || 'fallback-secret'
      ) as MobileTokenPayload

      return {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        technicianId: decoded.technicianId,
        companyId: decoded.companyId
      }
    } catch (error) {
      console.error('Invalid mobile token:', error)
      return null
    }
  }

  return null
}
