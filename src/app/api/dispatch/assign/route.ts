import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'

import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId, technicianId } = await request.json()

    if (!jobId || !technicianId) {
      return NextResponse.json(
        { error: 'jobId and technicianId are required' },
        { status: 400 }
      )
    }

    // Verify job exists and belongs to company
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!job || job.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.jobAssignment.findFirst({
      where: {
        jobId,
        technicianId,
      },
    })

    if (existingAssignment) {
      return NextResponse.json({ error: 'Job is already assigned to this technician' }, { status: 400 })
    }

    // Create assignment
    const assignment = await prisma.jobAssignment.create({
      data: {
        jobId,
        technicianId,
        isPrimary: true,
      },
    })

    // Update job status to SCHEDULED if it was PENDING
    if (job.status === 'PENDING') {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'SCHEDULED' },
      })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Assign job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
