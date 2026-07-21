import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/apiAuth'

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findFirst({
    where: { id: auth.id, companyId: auth.companyId, isActive: true },
    include: { technician: true },
  })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({
    id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`.trim(),
    phone: user.phone, role: user.role, companyId: user.companyId, createdAt: user.createdAt,
    technician: user.technician ? {
      id: user.technician.id, employeeId: user.technician.employeeId,
      certifications: user.technician.certifications, tradeTypes: user.technician.tradeTypes,
      currentLat: user.technician.currentLat, currentLng: user.technician.currentLng,
      lastLocationUpdate: user.technician.lastLocationUpdate, status: user.technician.status,
    } : null,
  })
}
