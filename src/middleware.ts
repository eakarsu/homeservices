/**
 * Helmet-style security headers + env-driven CORS for the home-services API.
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function getAllowedOrigins(): string[] {
  return (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function applyCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin')
  const allowed = getAllowedOrigins()
  let allowOrigin: string | null = null
  if (origin) {
    if (allowed.length === 0) allowOrigin = '*'
    else if (allowed.includes('*')) allowOrigin = '*'
    else if (allowed.includes(origin)) allowOrigin = origin
  }
  if (allowOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowOrigin)
    response.headers.set('Vary', 'Origin')
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  )
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}

function applySecurity(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=(self)'
  )
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Download-Options', 'noopen')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: wss:"
  )
  return response
}

export function middleware(request: NextRequest) {
  const isApi = request.nextUrl.pathname.startsWith('/api')
  if (isApi && request.method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 204 })
    applyCors(request, preflight)
    applySecurity(preflight)
    return preflight
  }

  const response = NextResponse.next()
  if (isApi) applyCors(request, response)
  return applySecurity(response)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
