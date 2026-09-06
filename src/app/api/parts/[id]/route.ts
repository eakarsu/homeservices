import {handle,bodyFor} from '@/lib/workflows/core'
import {savePart} from '@/lib/workflows/stock'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from "@/lib/apiAuth"
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const part = await prisma.part.findFirst({
      where: {
        id: (await params).id,
        companyId: user.companyId,
      },
      include: {
        truckStock: {
          include: {
            truck: {
              select: {
                id: true,
                name: true,
                vehicleId: true,
              },
            },
          },
        },
      },
    })

    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    return NextResponse.json(part)
  } catch (error) {
    console.error('Get part error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const PUT=(request:NextRequest,context:{params:Promise<{id:string}>})=>handle(request,async user=>savePart(user,await bodyFor(request),(await context.params).id))
export const DELETE=(request:NextRequest,context:{params:Promise<{id:string}>})=>handle(request,async user=>savePart(user,{isActive:false},(await context.params).id))
