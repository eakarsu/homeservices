import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getAuthUser } from '@/lib/apiAuth'
import { getAuthSigningSecret } from '@/lib/runtime-config'

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = jwt.sign(
    { sub: user.id, companyId: user.companyId, role: user.role, technicianId: user.technicianId },
    getAuthSigningSecret(),
    { algorithm: 'HS256', issuer: 'servicecrew', audience: 'servicecrew-socket', expiresIn: '5m' }
  )
  return NextResponse.json({ token, expiresIn: 300 })
}
