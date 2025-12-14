const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

interface GeocodingResult {
  lat: number
  lng: number
  formattedAddress: string
}

interface DistanceResult {
  distance: number // in meters
  duration: number // in seconds
  distanceText: string
  durationText: string
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('GOOGLE_MAPS_API_KEY is not configured')
    return null
  }

  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== 'OK' || !data.results.length) {
      return null
    }

    const result = data.results[0]
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

export async function getDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DistanceResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('GOOGLE_MAPS_API_KEY is not configured')
    return null
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${GOOGLE_MAPS_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`Distance Matrix API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== 'OK' || !data.rows.length || !data.rows[0].elements.length) {
      return null
    }

    const element = data.rows[0].elements[0]
    if (element.status !== 'OK') {
      return null
    }

    return {
      distance: element.distance.value,
      duration: element.duration.value,
      distanceText: element.distance.text,
      durationText: element.duration.text,
    }
  } catch (error) {
    console.error('Distance calculation error:', error)
    return null
  }
}

export function calculateRouteOrder(
  startLocation: { lat: number; lng: number },
  stops: { id: string; lat: number; lng: number; priority?: string }[]
): string[] {
  // Simple nearest neighbor algorithm
  if (stops.length === 0) return []
  if (stops.length === 1) return [stops[0].id]

  // Sort emergency jobs first
  const emergencyJobs = stops.filter(s => s.priority === 'EMERGENCY')
  const otherJobs = stops.filter(s => s.priority !== 'EMERGENCY')

  const orderedIds: string[] = []
  let currentLocation = startLocation
  const remaining = [...otherJobs]

  // Add emergency jobs first
  emergencyJobs.forEach(job => {
    orderedIds.push(job.id)
    currentLocation = { lat: job.lat, lng: job.lng }
  })

  // Nearest neighbor for remaining jobs
  while (remaining.length > 0) {
    let nearestIndex = 0
    let nearestDistance = Number.MAX_VALUE

    for (let i = 0; i < remaining.length; i++) {
      const distance = calculateHaversineDistance(
        currentLocation.lat,
        currentLocation.lng,
        remaining[i].lat,
        remaining[i].lng
      )
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = i
      }
    }

    orderedIds.push(remaining[nearestIndex].id)
    currentLocation = {
      lat: remaining[nearestIndex].lat,
      lng: remaining[nearestIndex].lng,
    }
    remaining.splice(nearestIndex, 1)
  }

  return orderedIds
}

function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

export function getStaticMapUrl(
  center: { lat: number; lng: number },
  markers: { lat: number; lng: number; label?: string; color?: string }[],
  options: { width?: number; height?: number; zoom?: number } = {}
): string {
  if (!GOOGLE_MAPS_API_KEY) return ''

  const { width = 600, height = 400, zoom = 12 } = options

  let url = `https://maps.googleapis.com/maps/api/staticmap?`
  url += `center=${center.lat},${center.lng}`
  url += `&zoom=${zoom}`
  url += `&size=${width}x${height}`
  url += `&maptype=roadmap`

  markers.forEach((marker, index) => {
    const color = marker.color || 'red'
    const label = marker.label || String.fromCharCode(65 + index) // A, B, C...
    url += `&markers=color:${color}%7Clabel:${label}%7C${marker.lat},${marker.lng}`
  })

  url += `&key=${GOOGLE_MAPS_API_KEY}`

  return url
}
