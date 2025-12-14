import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Verify job belongs to company
    const job = await prisma.job.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Append note to existing notes with timestamp
    const timestamp = new Date().toLocaleString()
    const userName = session.user.name || 'Unknown'
    const newNote = `[${timestamp}] ${userName}: ${content}`
    const updatedNotes = job.notes ? `${job.notes}\n\n${newNote}` : newNote

    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: { notes: updatedNotes },
      select: {
        id: true,
        notes: true,
      },
    })

    return NextResponse.json({
      id: params.id,
      content,
      createdAt: new Date().toISOString(),
      createdBy: {
        firstName: session.user.name?.split(' ')[0] || 'Unknown',
        lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
      },
      notes: updatedJob.notes,
    })
  } catch (error) {
    console.error('Add note error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
