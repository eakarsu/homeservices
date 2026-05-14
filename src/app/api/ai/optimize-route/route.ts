/**
 * POST /api/ai/optimize-route
 *
 * Reorder a technician's jobs for the day (or supplied subset) into the most
 * efficient order. Uses Claude with location/priority/duration context.
 *
 * Body: { technicianId: string; date?: string; jobIds?: string[] }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { optimizeRoute } from '@/lib/ai'
import { aiRateLimiter, logAIResult, AI_MODEL } from '@/lib/ai-utils'

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = aiRateLimiter(user.id)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'AI rate limit exceeded', retryAfter: Math.ceil(rl.resetIn / 1000) },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { technicianId, date, jobIds } = body
    if (!technicianId) {
      return NextResponse.json({ error: 'technicianId required' }, { status: 400 })
    }

    // Verify technician belongs to caller's company
    const tech = await prisma.technician.findFirst({
      where: { id: technicianId, user: { companyId: user.companyId } },
    })
    if (!tech) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
    }

    const targetDate = date ? new Date(date) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // Pull jobs assigned to this technician for the day (or the supplied subset)
    const jobAssignments = await prisma.jobAssignment.findMany({
      where: {
        technicianId,
        ...(Array.isArray(jobIds) && jobIds.length ? { jobId: { in: jobIds } } : {}),
        job: {
          companyId: user.companyId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS', 'PENDING'] },
          ...(Array.isArray(jobIds) && jobIds.length
            ? {}
            : {
                OR: [
                  { scheduledStart: { gte: targetDate, lt: nextDay } },
                  { scheduledStart: null },
                ],
              }),
        },
      },
      include: { job: { include: { property: true } } },
    })

    if (jobAssignments.length === 0) {
      return NextResponse.json({
        optimizedOrder: [],
        totalDistance: 0,
        totalTime: 0,
        savings: { distance: 0, time: 0 },
        reasoning: 'No jobs to optimise for this technician/date.',
      })
    }

    const jobs = jobAssignments.map((a) => ({
      id: a.job.id,
      address: a.job.property?.address || '',
      scheduledStart: a.job.scheduledStart || undefined,
      priority: a.job.priority,
      estimatedDuration: a.job.estimatedDuration || 60,
    }))

    const result = await optimizeRoute(technicianId, jobs)

    await logAIResult({
      feature: 'optimize-route',
      userId: user.id,
      companyId: user.companyId,
      input: { technicianId, jobCount: jobs.length, date: targetDate.toISOString() },
      output: result,
      durationMs: Date.now() - startedAt,
      success: true,
    })

    return NextResponse.json({
      ...result,
      _meta: { model: AI_MODEL, jobCount: jobs.length, rateLimit: { remaining: rl.remaining } },
    })
  } catch (error) {
    console.error('Optimize route error:', error)
    await logAIResult({
      feature: 'optimize-route',
      input: {},
      output: {},
      durationMs: Date.now() - startedAt,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json(
      {
        error: 'Route optimisation failed',
        message: error instanceof Error ? error.message : 'unknown',
      },
      { status: 500 }
    )
  }
}
