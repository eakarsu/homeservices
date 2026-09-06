import {handle,bodyFor} from '@/lib/workflows/core'
import {updateJob} from '@/lib/workflows/execution'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { prisma } from '@/lib/prisma'
import { emitJobCompleted } from '@/lib/socket'
import { canEditJob, canReadJob, isValidJobTransition } from '@/lib/operations-governance'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const job = await prisma.job.findFirst({
      where: {
        id: (await params).id,
        companyId: user.companyId,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            phone: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        serviceType: {
          select: {
            id: true,
            name: true,
            tradeType: true,
          },
        },
        assignments: {
          include: {
            technician: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    if (!canReadJob(user, job)) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    return NextResponse.json(job)
  } catch (error) {
    console.error('Get job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const PUT=(request:NextRequest,context:{params:Promise<{id:string}>})=>handle(request,async user=>updateJob(user,(await context.params).id,await bodyFor(request)))

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Operational jobs are retained; cancel the job instead of deleting it' }, { status: 405 })
  } catch (error) {
    console.error('Delete job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
