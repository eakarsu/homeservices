/**
 * Socket.IO server singleton for real-time events.
 *
 * Next.js App Router does not expose the raw http.Server directly, so we use
 * a global singleton pattern and attach Socket.IO in a custom server.ts.
 *
 * This module exports:
 *  - getIO()          — returns the current io instance (throws if not initialized)
 *  - initIO(server)   — called once from server.ts to bootstrap Socket.IO
 *  - emitJobAssigned  — emit when a technician is assigned to a job
 *  - emitJobCompleted — emit when a job is marked complete
 *  - emitTechLocation — emit live GPS location update
 *  - emitTechNearby   — emit geofence alert when tech is within 500m of job site
 */

import type { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, type Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { getAuthSigningSecret } from './runtime-config'

// Global singleton so hot-reload doesn't create multiple instances in dev
declare global {
  // eslint-disable-next-line no-var
  var __socketio: SocketIOServer | undefined
}

export function initIO(httpServer: HTTPServer): SocketIOServer {
  if (global.__socketio) return global.__socketio

  const io = new SocketIOServer(httpServer, {
    path: '/api/socketio',
    cors: {
      origin: process.env.NEXTAUTH_URL ? [process.env.NEXTAUTH_URL] : [],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  io.use((socket, next) => {
    try {
      const token = typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : ''
      const claims = jwt.verify(token, getAuthSigningSecret(), {
        algorithms: ['HS256'], issuer: 'servicecrew', audience: 'servicecrew-socket',
      }) as { sub: string; companyId: string; role: string; technicianId?: string }
      socket.data.auth = claims
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const auth = socket.data.auth as { sub: string; companyId: string; role: string; technicianId?: string }

    // Client joins a job-specific room for targeted updates
    socket.on('join:job', async (jobId: string) => {
      if (typeof jobId !== 'string' || jobId.length > 100) return
      const job = await prisma.job.findFirst({
        where: {
          id: jobId, companyId: auth.companyId,
          ...(auth.role === 'TECHNICIAN' ? { assignments: { some: { technicianId: auth.technicianId || '__none__' } } } : {}),
        },
        select: { id: true },
      })
      if (job) await socket.join(`job:${job.id}`)
    })

    // Client joins a company-wide room (dispatch board)
    socket.on('join:company', (companyId: string) => {
      if (companyId === auth.companyId && auth.role !== 'TECHNICIAN') socket.join(`company:${companyId}`)
    })

    // Technician mobile client joins their own room
    socket.on('join:technician', async (technicianId: string) => {
      if (typeof technicianId !== 'string' || technicianId.length > 100) return
      if (auth.role === 'TECHNICIAN' && technicianId !== auth.technicianId) return
      const technician = await prisma.technician.findFirst({
        where: { id: technicianId, user: { companyId: auth.companyId, isActive: true } }, select: { id: true },
      })
      if (technician) await socket.join(`technician:${technician.id}`)
    })

    socket.on('disconnect', () => undefined)
  })

  global.__socketio = io
  console.log('[Socket.IO] Server initialized')
  return io
}

export function getIO(): SocketIOServer {
  if (!global.__socketio) {
    throw new Error('Socket.IO server not initialized. Call initIO(httpServer) first.')
  }
  return global.__socketio
}

// ============ Event emitters ============

export interface JobAssignedPayload {
  jobId: string
  jobNumber: string
  technicianId: string
  technicianName: string
  companyId: string
  scheduledStart: string | null
}

export interface JobCompletedPayload {
  jobId: string
  jobNumber: string
  technicianId: string
  completedAt: string
  companyId: string
  actualAmount?: number
}

export interface TechLocationPayload {
  technicianId: string
  lat: number
  lng: number
  accuracy: number
  timestamp: string
  companyId: string
}

export interface TechNearbyPayload {
  technicianId: string
  technicianName: string
  jobId: string
  jobNumber: string
  distanceMeters: number
  companyId: string
}

/**
 * Emits job:assigned to the job room and company-wide room.
 * Called from POST /api/dispatch/assign after DB write.
 */
export function emitJobAssigned(payload: JobAssignedPayload): void {
  try {
    const io = getIO()
    io.to(`job:${payload.jobId}`).emit('job:assigned', payload)
    io.to(`company:${payload.companyId}`).emit('job:assigned', payload)
  } catch {
    // Socket.IO not initialized (e.g., running tests) — silently skip
  }
}

/**
 * Emits job:completed to the job room and company-wide room.
 * Called when job status transitions to COMPLETED.
 */
export function emitJobCompleted(payload: JobCompletedPayload): void {
  try {
    const io = getIO()
    io.to(`job:${payload.jobId}`).emit('job:completed', payload)
    io.to(`company:${payload.companyId}`).emit('job:completed', payload)
  } catch {
    // Socket.IO not initialized — silently skip
  }
}

/**
 * Emits technician:location to the company-wide room.
 * Called from POST /api/technicians/:id/location.
 */
export function emitTechLocation(payload: TechLocationPayload): void {
  try {
    const io = getIO()
    io.to(`company:${payload.companyId}`).emit('technician:location', payload)
  } catch {
    // Socket.IO not initialized — silently skip
  }
}

/**
 * Emits technician:nearby to the job room when tech enters 500m geofence.
 */
export function emitTechNearby(payload: TechNearbyPayload): void {
  try {
    const io = getIO()
    io.to(`job:${payload.jobId}`).emit('technician:nearby', payload)
    io.to(`company:${payload.companyId}`).emit('technician:nearby', payload)
  } catch {
    // Socket.IO not initialized — silently skip
  }
}
