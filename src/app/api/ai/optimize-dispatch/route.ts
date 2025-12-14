import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai'
import { format, addMinutes } from 'date-fns'

interface SampleTechnician {
  id: string
  name: string
  status: string
  currentLocation: { lat: number; lng: number } | null
  assignedJobs: number
  skills: string[]
}

interface SampleJob {
  id: string
  jobNumber: string
  title: string
  priority: string
  tradeType: string
  estimatedDuration: number
  customerName: string
  address: string
  location: { lat: number; lng: number } | null
}

interface OptimizeRequest {
  date?: string
  technicianIds?: string[]
  jobIds?: string[]
  optimizeFor?: 'time' | 'distance' | 'balanced'
  useSampleData?: boolean
  techniciansData?: SampleTechnician[]
  jobsData?: SampleJob[]
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle empty body gracefully
    let body: OptimizeRequest = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch {
      // Empty or invalid JSON body - use defaults
    }
    const { date, optimizeFor = 'balanced', useSampleData, techniciansData, jobsData } = body

    let jobsList: { index: number; id: string; jobNumber: string; title: string; priority: string; tradeType: string; address: string; estimatedDuration: number; customerName: string }[]
    let techsList: { index: number; id: string; name: string; skills: string[]; status: string; currentJobs: number }[]

    if (useSampleData && techniciansData && jobsData) {
      // Use sample data directly
      jobsList = jobsData.map((job, i) => ({
        index: i + 1,
        id: job.id,
        jobNumber: job.jobNumber,
        title: job.title,
        priority: job.priority,
        tradeType: job.tradeType,
        address: job.address,
        estimatedDuration: job.estimatedDuration,
        customerName: job.customerName,
      }))

      techsList = techniciansData.map((tech, i) => ({
        index: i + 1,
        id: tech.id,
        name: tech.name,
        skills: tech.skills,
        status: tech.status,
        currentJobs: tech.assignedJobs,
      }))
    } else {
      // Normal mode - get data from database
      const targetDate = date ? new Date(date) : new Date()
      targetDate.setHours(0, 0, 0, 0)
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)

      // Get unassigned jobs
      const unassignedJobs = await prisma.job.findMany({
        where: {
          companyId: session.user.companyId,
          status: { in: ['PENDING', 'SCHEDULED'] },
          assignments: { none: {} },
          OR: [
            { scheduledStart: null },
            {
              scheduledStart: {
                gte: targetDate,
                lt: nextDay,
              },
            },
          ],
        },
        include: {
          property: true,
          customer: true,
          serviceType: true,
        },
      })

      if (unassignedJobs.length === 0) {
        return NextResponse.json({
          assignments: [],
          metrics: {
            totalTravelTime: 0,
            avgTravelTime: 0,
            jobsAssigned: 0,
            unassignedJobs: 0,
          },
          warnings: ['No unassigned jobs found for the selected date'],
        })
      }

      // Get available technicians
      const technicians = await prisma.technician.findMany({
        where: {
          user: {
            companyId: session.user.companyId,
            isActive: true,
          },
          status: { in: ['AVAILABLE', 'ON_JOB'] },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          assignments: {
            where: {
              job: {
                scheduledStart: {
                  gte: targetDate,
                  lt: nextDay,
                },
              },
            },
            include: {
              job: true,
            },
          },
        },
      })

      if (technicians.length === 0) {
        return NextResponse.json({
          assignments: [],
          metrics: {
            totalTravelTime: 0,
            avgTravelTime: 0,
            jobsAssigned: 0,
            unassignedJobs: unassignedJobs.length,
          },
          warnings: ['No available technicians found'],
        })
      }

      jobsList = unassignedJobs.map((job, i) => ({
        index: i + 1,
        id: job.id,
        jobNumber: job.jobNumber,
        title: job.title || job.serviceType?.name || 'Service Call',
        priority: job.priority,
        tradeType: job.tradeType,
        address: job.property?.address || 'Unknown',
        estimatedDuration: job.estimatedDuration || 60,
        customerName: job.customer ? `${job.customer.firstName || ''} ${job.customer.lastName || ''}`.trim() || job.customer.companyName || 'Unknown' : 'Unknown',
      }))

      techsList = technicians.map((tech, i) => ({
        index: i + 1,
        id: tech.id,
        name: `${tech.user.firstName} ${tech.user.lastName}`,
        skills: tech.tradeTypes,
        status: tech.status,
        currentJobs: tech.assignments.length,
      }))
    }

    // Build AI prompt for optimization
    const systemPrompt = `You are an intelligent dispatch optimizer for a home services company.
Analyze job requirements and technician availability to recommend optimal assignments.
Consider: skills match, location proximity, current workload, and job priority.
Optimize for: ${optimizeFor === 'time' ? 'minimum travel time' : optimizeFor === 'distance' ? 'minimum distance' : 'balanced efficiency'}.
Always respond with valid JSON.`

    const userPrompt = `Jobs to assign:
${jobsList.map(j => `${j.index}. [${j.jobNumber}] ${j.title} - ${j.priority} priority, ${j.tradeType}, ${j.address}, ${j.estimatedDuration}min`).join('\n')}

Available Technicians:
${techsList.map(t => `${t.index}. ${t.name} (ID: ${t.id}) - Skills: ${t.skills.join(', ')}, Status: ${t.status}, Jobs today: ${t.currentJobs}`).join('\n')}

Provide optimal assignments in this exact JSON format:
{
  "assignments": [
    {
      "jobIndex": number,
      "techIndex": number,
      "estimatedTravelTime": number (minutes),
      "reason": "string explaining why this assignment"
    }
  ],
  "unassignedJobIndexes": [number array of jobs that couldn't be assigned],
  "warnings": ["string array of any concerns"]
}`

    let assignments: {
      jobId: string
      jobNumber: string
      technicianId: string
      technicianName: string
      estimatedTravelTime: number
      estimatedArrival: string
      reason: string
    }[] = []
    let warnings: string[] = []
    let unassignedCount = jobsList.length

    try {
      const response = await callAI(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        { temperature: 0.3, maxTokens: 2000 }
      )

      const aiResult = JSON.parse(response)
      const now = new Date()

      for (const assignment of aiResult.assignments || []) {
        const job = jobsList[assignment.jobIndex - 1]
        const tech = techsList[assignment.techIndex - 1]

        if (job && tech) {
          const travelTime = assignment.estimatedTravelTime || 20
          const arrivalTime = addMinutes(now, travelTime)

          assignments.push({
            jobId: job.id,
            jobNumber: job.jobNumber,
            technicianId: tech.id,
            technicianName: tech.name,
            estimatedTravelTime: travelTime,
            estimatedArrival: format(arrivalTime, 'h:mm a'),
            reason: assignment.reason || `Best match based on skills and availability`,
          })
        }
      }

      warnings = aiResult.warnings || []
      unassignedCount = aiResult.unassignedJobIndexes?.length || (jobsList.length - assignments.length)

    } catch {
      // Fallback: simple assignment based on availability
      warnings.push('AI optimization failed, using simple assignment')

      let techIndex = 0
      for (const job of jobsList) {
        if (techIndex >= techsList.length) break

        const tech = techsList[techIndex]
        const matchingTech = tech.skills.includes(job.tradeType || '') ? tech : techsList.find(t => t.skills.includes(job.tradeType || '')) || tech

        const travelTime = 15 + Math.floor(Math.random() * 20)
        const arrivalTime = addMinutes(new Date(), travelTime)

        assignments.push({
          jobId: job.id,
          jobNumber: job.jobNumber,
          technicianId: matchingTech.id,
          technicianName: matchingTech.name,
          estimatedTravelTime: travelTime,
          estimatedArrival: format(arrivalTime, 'h:mm a'),
          reason: `Assigned based on availability and ${matchingTech.skills.includes(job.tradeType || '') ? 'skill match' : 'general availability'}`,
        })

        techIndex++
      }

      unassignedCount = jobsList.length - assignments.length
    }

    const totalTravelTime = assignments.reduce((sum, a) => sum + a.estimatedTravelTime, 0)
    const avgTravelTime = assignments.length > 0 ? Math.round(totalTravelTime / assignments.length) : 0

    // Actually save the assignments to the database (only if not using sample data)
    if (!useSampleData && assignments.length > 0) {
      for (const assignment of assignments) {
        try {
          // Check if assignment already exists
          const existingAssignment = await prisma.jobAssignment.findFirst({
            where: {
              jobId: assignment.jobId,
              technicianId: assignment.technicianId,
            },
          })

          if (!existingAssignment) {
            // Create the assignment
            await prisma.jobAssignment.create({
              data: {
                jobId: assignment.jobId,
                technicianId: assignment.technicianId,
                isPrimary: true,
              },
            })

            // Update job status to SCHEDULED if it was PENDING
            await prisma.job.update({
              where: { id: assignment.jobId },
              data: { status: 'SCHEDULED' },
            })
          }
        } catch (err) {
          console.error(`Failed to create assignment for job ${assignment.jobId}:`, err)
          warnings.push(`Failed to assign job ${assignment.jobNumber}`)
        }
      }
    }

    return NextResponse.json({
      assignments,
      metrics: {
        totalTravelTime,
        avgTravelTime,
        jobsAssigned: assignments.length,
        unassignedJobs: unassignedCount,
      },
      warnings,
    })
  } catch (error) {
    console.error('Optimize dispatch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
