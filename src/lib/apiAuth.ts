import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import jwt from 'jsonwebtoken'

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
  // First try NextAuth session (for web users)
  const session = await getServerSession(authOptions)
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email!,
      role: session.user.role,
      companyId: session.user.companyId,
      technicianId: session.user.technicianId
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
      ) as { sub: string; email: string; role: string; companyId: string; technicianId?: string }

      return {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        companyId: decoded.companyId,
        technicianId: decoded.technicianId
      }
    } catch {
      return null
    }
  }

  return null
}
