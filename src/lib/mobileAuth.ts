import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'

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
  return getAuthUser(request)
}
