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
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  io.on('connection', (socket: Socket) => {
    console.log('[Socket.IO] Client connected:', socket.id)

    // Client joins a job-specific room for targeted updates
    socket.on('join:job', (jobId: string) => {
      socket.join(`job:${jobId}`)
      console.log(`[Socket.IO] ${socket.id} joined room job:${jobId}`)
    })

    // Client joins a company-wide room (dispatch board)
    socket.on('join:company', (companyId: string) => {
      socket.join(`company:${companyId}`)
      console.log(`[Socket.IO] ${socket.id} joined room company:${companyId}`)
    })

    // Technician mobile client joins their own room
    socket.on('join:technician', (technicianId: string) => {
      socket.join(`technician:${technicianId}`)
      console.log(`[Socket.IO] ${socket.id} joined room technician:${technicianId}`)
    })

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Client disconnected:', socket.id)
    })
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
