import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai'
import { format, addDays, parseISO } from 'date-fns'

interface SampleCustomer {
  id: string
  name: string
  address: string
  preferredTimes: string[]
}

interface SampleService {
  id: string
  name: string
  estimatedDuration: number
  tradeType: string
}

interface SchedulingRequest {
  customerId?: string
  serviceTypeId?: string
  preferredDate: string
  preferredTime: 'morning' | 'afternoon' | 'evening'
  urgency: 'low' | 'normal' | 'high'
  notes?: string
  useSampleData?: boolean
  customerData?: SampleCustomer
  serviceData?: SampleService
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SchedulingRequest = await request.json()
    const { customerId, serviceTypeId, preferredDate, preferredTime, urgency, notes, useSampleData, customerData, serviceData } = body

    let customerName: string
    let customerAddress: string
    let serviceName: string
    let serviceTradeType: string
    let serviceDuration: number
    let techSchedules: { id: string; name: string; skills: string[]; existingJobs: { date: string; time: string; duration: number }[] }[]

    if (useSampleData && customerData && serviceData) {
      // Use sample data directly
      customerName = customerData.name
      customerAddress = customerData.address
      serviceName = serviceData.name
      serviceTradeType = serviceData.tradeType
      serviceDuration = serviceData.estimatedDuration

      // Create sample technician schedules
      techSchedules = [
        {
          id: 'tech-1',
          name: 'Mike Johnson',
          skills: ['HVAC', 'Refrigeration'],
          existingJobs: [
            { date: format(parseISO(preferredDate), 'yyyy-MM-dd'), time: '8:00 AM', duration: 60 }
          ]
        },
        {
          id: 'tech-2',
          name: 'Sarah Williams',
          skills: ['HVAC', 'Electrical'],
          existingJobs: []
        },
        {
          id: 'tech-3',
          name: 'David Chen',
          skills: ['Plumbing', 'HVAC'],
          existingJobs: [
            { date: format(parseISO(preferredDate), 'yyyy-MM-dd'), time: '1:00 PM', duration: 90 }
          ]
        }
      ]
    } else {
      // Normal mode - get data from database
      if (!customerId || !serviceTypeId || !preferredDate) {
        return NextResponse.json(
          { error: 'customerId, serviceTypeId, and preferredDate are required' },
          { status: 400 }
        )
      }

      // Get customer info
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          companyId: session.user.companyId
        },
        include: {
          properties: true
        }
      })

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      // Get service type
      const serviceType = await prisma.serviceType.findFirst({
        where: {
          id: serviceTypeId,
          companyId: session.user.companyId
        }
      })

      if (!serviceType) {
        return NextResponse.json({ error: 'Service type not found' }, { status: 404 })
      }

      customerName = customer.firstName ? `${customer.firstName} ${customer.lastName}` : customer.companyName || 'Unknown'
      customerAddress = customer.properties[0]?.address || 'Unknown'
      serviceName = serviceType.name
      serviceTradeType = serviceType.tradeType
      serviceDuration = serviceType.defaultDuration || 60

      // Get available technicians with matching skills
      const technicians = await prisma.technician.findMany({
        where: {
          user: {
            companyId: session.user.companyId,
            isActive: true
          },
          tradeTypes: { has: serviceType.tradeType }
        },
        include: {
          user: {
            select: { firstName: true, lastName: true }
          },
          assignments: {
            where: {
              job: {
                scheduledStart: {
                  gte: parseISO(preferredDate),
                  lt: addDays(parseISO(preferredDate), 7)
                }
              }
            },
            include: {
              job: {
                select: {
                  scheduledStart: true,
                  estimatedDuration: true,
                  status: true
                }
              }
            }
          }
        }
      })

      if (technicians.length === 0) {
        return NextResponse.json({
          suggestions: [],
          bestOption: -1,
          customerPreferenceMatch: 0,
          warnings: ['No technicians available with required skills']
        })
      }

      techSchedules = technicians.map(tech => ({
        id: tech.id,
        name: `${tech.user.firstName} ${tech.user.lastName}`,
        skills: tech.tradeTypes,
        existingJobs: tech.assignments.map(a => ({
          date: a.job.scheduledStart ? format(a.job.scheduledStart, 'yyyy-MM-dd') : 'unscheduled',
          time: a.job.scheduledStart ? format(a.job.scheduledStart, 'h:mm a') : 'TBD',
          duration: a.job.estimatedDuration || 60
        }))
      }))
    }

    // Build AI prompt
    const timeSlots = {
      morning: '8:00 AM - 12:00 PM',
      afternoon: '12:00 PM - 5:00 PM',
      evening: '5:00 PM - 8:00 PM'
    }

    const systemPrompt = `You are an intelligent scheduling assistant for a home services company.
Analyze technician availability and customer preferences to suggest optimal appointment slots.
Consider: technician skills, existing appointments, travel time, and customer preferences.
Always respond with valid JSON.`

    const userPrompt = `Customer: ${customerName}
Customer Address: ${customerAddress}
Service Needed: ${serviceName} (${serviceTradeType})
Estimated Duration: ${serviceDuration} minutes

Preferences:
- Preferred Date: ${preferredDate}
- Preferred Time: ${preferredTime} (${timeSlots[preferredTime]})
- Urgency: ${urgency}
${notes ? `- Notes: ${notes}` : ''}

Available Technicians and Schedules:
${techSchedules.map(t => `- ${t.name} (${t.skills.join(', ')}): ${t.existingJobs.length} jobs scheduled`).join('\n')}

Suggest 3-5 optimal appointment slots for the next 7 days in this JSON format:
{
  "suggestions": [
    {
      "date": "YYYY-MM-DD",
      "timeSlot": "HH:MM AM/PM - HH:MM AM/PM",
      "technicianId": "tech_id",
      "technicianName": "name",
      "score": 0-100,
      "reasons": ["reason1", "reason2"],
      "travelTime": estimated_minutes,
      "conflicts": ["conflict1"] or []
    }
  ],
  "bestOption": index_of_best (0-based),
  "customerPreferenceMatch": 0-100,
  "warnings": ["any scheduling concerns"]
}`

    let suggestions: {
      date: string
      timeSlot: string
      technicianId: string
      technicianName: string
      score: number
      reasons: string[]
      travelTime: number
      conflicts: string[]
    }[] = []
    let bestOption = 0
    let customerPreferenceMatch = 85
    let warnings: string[] = []

    try {
      const response = await callAI(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        { temperature: 0.4, maxTokens: 2000 }
      )

      const aiResult = JSON.parse(response)
      suggestions = aiResult.suggestions || []
      bestOption = aiResult.bestOption || 0
      customerPreferenceMatch = aiResult.customerPreferenceMatch || 85
      warnings = aiResult.warnings || []

      // Ensure technician IDs match actual technicians
      suggestions = suggestions.map(s => {
        const tech = techSchedules.find(t =>
          t.id === s.technicianId ||
          t.name === s.technicianName
        )
        return {
          ...s,
          technicianId: tech?.id || techSchedules[0].id,
          technicianName: tech?.name || s.technicianName
        }
      })

    } catch {
      // Fallback: generate simple suggestions
      warnings.push('AI optimization unavailable, using standard scheduling')

      const baseDate = parseISO(preferredDate)
      const timeSlotMap = {
        morning: '9:00 AM - 11:00 AM',
        afternoon: '1:00 PM - 3:00 PM',
        evening: '5:00 PM - 7:00 PM'
      }

      for (let i = 0; i < Math.min(3, techSchedules.length); i++) {
        const tech = techSchedules[i]
        const slotDate = addDays(baseDate, i)

        suggestions.push({
          date: format(slotDate, 'yyyy-MM-dd'),
          timeSlot: timeSlotMap[preferredTime],
          technicianId: tech.id,
          technicianName: tech.name,
          score: 90 - (i * 10),
          reasons: [
            'Matches required skills',
            i === 0 ? 'Preferred date' : `${i} day${i > 1 ? 's' : ''} after preferred`,
            'Technician available'
          ],
          travelTime: 15 + (i * 5),
          conflicts: []
        })
      }

      customerPreferenceMatch = 75
    }

    return NextResponse.json({
      suggestions,
      bestOption,
      customerPreferenceMatch,
      warnings
    })
  } catch (error) {
    console.error('Smart scheduling error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
