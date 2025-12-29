import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/mobileAuth'
import { prisma } from '@/lib/prisma'

interface LocationUpdateRequest {
  latitude: number
  longitude: number
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only technicians can update their location
    if (!user.technicianId) {
      return NextResponse.json(
        { error: 'Only technicians can update location' },
        { status: 403 }
      )
    }

    const body: LocationUpdateRequest = await request.json()
    const { latitude, longitude } = body

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude' },
        { status: 400 }
      )
    }

    // Update technician's location
    await prisma.technician.update({
      where: { id: user.technicianId },
      data: {
        currentLat: latitude,
        currentLng: longitude,
        lastLocationUpdate: new Date()
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Location update error:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

// Also support POST for compatibility
export async function POST(request: NextRequest) {
  return PUT(request)
}
