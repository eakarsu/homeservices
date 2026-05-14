import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { emitTechLocation, emitTechNearby } from '@/lib/socket'

/**
 * POST /api/technicians/:id/location
 *
 * Updates a technician's GPS coordinates.
 * After updating, runs geofence check against all of the technician's
 * active jobs. If the technician is within 500 m of a job site,
 * emits a technician:nearby Socket.IO event (TECHNICIAN_NEARBY alert).
 *
 * Auth: authenticated user (web session or Bearer JWT).
 *   - ADMIN/DISPATCHER may update any technician in their company.
 *   - TECHNICIAN may only update their own location.
 */

// Haversine formula — returns distance in metres between two GPS points.
function haversineMetres(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000 // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const GEOFENCE_METRES = 500

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: technicianId } = params

    // Authorization: technicians can only update their own location
    if (user.role === 'TECHNICIAN' && user.technicianId !== technicianId) {
      return NextResponse.json(
        { error: 'Technicians may only update their own location' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { lat, lng, accuracy = 0 } = body as {
      lat: number
      lng: number
      accuracy?: number
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { error: 'lat and lng are required numbers' },
        { status: 400 },
      )
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'lat must be -90…90, lng must be -180…180' },
        { status: 400 },
      )
    }

    // Fetch the technician (verifies they belong to the caller's company)
    const technician = await prisma.technician.findFirst({
      where: {
        id: technicianId,
        user: { companyId: user.companyId },
      },
      include: {
        user: { select: { firstName: true, lastName: true, companyId: true } },
        // Active job assignments — we need job property lat/lng for geofencing
        assignments: {
          where: {
            job: {
              status: { in: ['SCHEDULED', 'DISPATCHED', 'EN_ROUTE', 'IN_PROGRESS'] },
            },
          },
          include: {
            job: {
              include: {
                property: { select: { lat: true, lng: true, address: true } },
              },
            },
          },
        },
      },
    })

    if (!technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
    }

    // Persist updated coordinates
    await prisma.technician.update({
      where: { id: technicianId },
      data: {
        currentLat: lat,
        currentLng: lng,
        lastLocationUpdate: new Date(),
      },
    })

    const companyId = technician.user.companyId
    const technicianName = `${technician.user.firstName} ${technician.user.lastName}`
    const timestamp = new Date().toISOString()

    // Broadcast location to the company's dispatch board
    emitTechLocation({
      technicianId,
      lat,
      lng,
      accuracy,
      timestamp,
      companyId,
    })

    // ---- Geofence check ----
    const nearbyAlerts: {
      jobId: string
      jobNumber: string
      distanceMeters: number
    }[] = []

    for (const assignment of technician.assignments) {
      const { job } = assignment
      // Property model stores address only (no lat/lng columns yet).
      // Geofencing requires coordinate columns on Property — skip if absent.
      // To enable: add `lat Decimal? @db.Decimal(10, 7)` and `lng Decimal? @db.Decimal(10, 7)`
      // to the Property model in prisma/schema.prisma.
      const prop = job.property as { lat?: number | null; lng?: number | null } | null
      const propLat = prop?.lat
      const propLng = prop?.lng

      if (propLat == null || propLng == null) continue

      const distanceMeters = haversineMetres(
        lat, lng,
        Number(propLat), Number(propLng),
      )

      if (distanceMeters <= GEOFENCE_METRES) {
        nearbyAlerts.push({
          jobId: job.id,
          jobNumber: job.jobNumber,
          distanceMeters: Math.round(distanceMeters),
        })

        emitTechNearby({
          technicianId,
          technicianName,
          jobId: job.id,
          jobNumber: job.jobNumber,
          distanceMeters: Math.round(distanceMeters),
          companyId,
        })
      }
    }

    return NextResponse.json({
      success: true,
      technicianId,
      lat,
      lng,
      timestamp,
      geofence: {
        radiusMetres: GEOFENCE_METRES,
        nearbyJobs: nearbyAlerts,
      },
    })
  } catch (error) {
    console.error('Technician location update error:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 },
    )
  }
}
