import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { callAI } from '@/lib/ai'
import { differenceInMonths, differenceInYears, format } from 'date-fns'

interface SampleEquipment {
  id: string
  name: string
  type: string
  age: number
  lastService: string | null
  customerId: string
  customerName: string
  address: string
}

interface PredictiveRequest {
  customerId?: string
  analyzeAll?: boolean
  equipmentData?: SampleEquipment[]
  useSampleData?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: PredictiveRequest = await request.json()
    const { customerId, analyzeAll, equipmentData, useSampleData } = body

    let equipmentWithHistory: {
      id: string
      name: string
      type: string
      age: number
      monthsSinceService: number
      lastServiceDate: string | null
      serviceHistory: number
      customerId: string
      customerName: string
      address: string
    }[] = []

    // If sample data is provided, use it directly
    if (useSampleData && equipmentData && equipmentData.length > 0) {
      equipmentWithHistory = equipmentData.map(eq => {
        const lastServiceDate = eq.lastService ? new Date(eq.lastService) : null
        const monthsSinceService = lastServiceDate
          ? differenceInMonths(new Date(), lastServiceDate)
          : 24

        return {
          id: eq.id,
          name: eq.name,
          type: eq.type,
          age: eq.age,
          monthsSinceService,
          lastServiceDate: lastServiceDate ? format(lastServiceDate, 'MMM d, yyyy') : null,
          serviceHistory: lastServiceDate ? 3 : 0, // Assume some history if there's a last service
          customerId: eq.customerId,
          customerName: eq.customerName,
          address: eq.address
        }
      })
    } else {
      // Get equipment from database
      const equipment = await prisma.equipment.findMany({
        where: {
          property: {
            customer: {
              companyId: session.user.companyId,
              ...(customerId && !analyzeAll ? { id: customerId } : {})
            }
          }
        },
        include: {
          property: {
            include: {
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  companyName: true
                }
              }
            }
          }
        }
      })

      if (equipment.length === 0) {
        return NextResponse.json({
          predictions: [],
          summary: {
            totalEquipment: 0,
            criticalCount: 0,
            highRiskCount: 0,
            totalPotentialSavings: 0,
            avgMaintenanceScore: 0
          },
          insights: ['No equipment found for analysis']
        })
      }

      // Get service history for equipment
      equipmentWithHistory = await Promise.all(
        equipment.map(async (eq) => {
          const jobs = await prisma.job.findMany({
            where: {
              propertyId: eq.propertyId,
              status: 'COMPLETED'
            },
            orderBy: { completedAt: 'desc' },
            take: 5,
            select: {
              completedAt: true,
              title: true,
              tradeType: true
            }
          })

          const ageYears = eq.installDate
            ? differenceInYears(new Date(), eq.installDate)
            : 0

          const lastService = jobs[0]?.completedAt
          const monthsSinceService = lastService
            ? differenceInMonths(new Date(), lastService)
            : 24

          return {
            id: eq.id,
            name: `${eq.brand || ''} ${eq.model || eq.type}`.trim() || eq.type,
            type: eq.type,
            age: ageYears,
            monthsSinceService,
            lastServiceDate: lastService ? format(lastService, 'MMM d, yyyy') : null,
            serviceHistory: jobs.length,
            customerId: eq.property.customer.id,
            customerName: eq.property.customer.firstName
              ? `${eq.property.customer.firstName} ${eq.property.customer.lastName}`
              : eq.property.customer.companyName || 'Unknown',
            address: eq.property.address
          }
        })
      )
    }

    if (equipmentWithHistory.length === 0) {
      return NextResponse.json({
        predictions: [],
        summary: {
          totalEquipment: 0,
          criticalCount: 0,
          highRiskCount: 0,
          totalPotentialSavings: 0,
          avgMaintenanceScore: 0
        },
        insights: ['No equipment found for analysis']
      })
    }

    // Build AI prompt
    const systemPrompt = `You are an expert predictive maintenance AI for HVAC, plumbing, and electrical equipment.
Analyze equipment data to predict failures and recommend preventive maintenance.
Consider: equipment age, type, service history, and industry failure patterns.
Always respond with valid JSON.`

    const userPrompt = `Analyze this equipment for maintenance predictions:

${equipmentWithHistory.map((eq, i) => `${i + 1}. ${eq.name}
   - Type: ${eq.type}
   - Age: ${eq.age} years
   - Last Service: ${eq.lastServiceDate || 'Never recorded'}
   - Months Since Service: ${eq.monthsSinceService}
   - Service History: ${eq.serviceHistory} recorded services
   - Customer: ${eq.customerName}
`).join('\n')}

For each piece of equipment, provide predictions in this JSON format:
{
  "predictions": [
    {
      "equipmentIndex": number (1-based),
      "riskLevel": "low" | "medium" | "high" | "critical",
      "failureProbability": 0-100,
      "predictedIssues": [
        {
          "issue": "string",
          "probability": 0-100,
          "timeframe": "string (e.g., '1-3 months')",
          "impact": "minor" | "moderate" | "major"
        }
      ],
      "recommendedActions": [
        {
          "action": "string",
          "urgency": "immediate" | "soon" | "scheduled",
          "estimatedCost": number,
          "preventsSavings": number
        }
      ],
      "maintenanceScore": 0-100,
      "nextRecommendedService": "string (e.g., 'Within 30 days')",
      "costSavingsIfActedNow": number
    }
  ],
  "insights": ["string array of overall insights"]
}`

    let predictions: {
      equipmentId: string
      equipmentName: string
      riskLevel: 'low' | 'medium' | 'high' | 'critical'
      failureProbability: number
      predictedIssues: {
        issue: string
        probability: number
        timeframe: string
        impact: string
      }[]
      recommendedActions: {
        action: string
        urgency: 'immediate' | 'soon' | 'scheduled'
        estimatedCost: number
        preventsSavings: number
      }[]
      maintenanceScore: number
      nextRecommendedService: string
      costSavingsIfActedNow: number
    }[] = []
    let insights: string[] = []

    try {
      const response = await callAI(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        { temperature: 0.3, maxTokens: 3000 }
      )

      const aiResult = JSON.parse(response)

      predictions = (aiResult.predictions || []).map((p: {
        equipmentIndex: number
        riskLevel: 'low' | 'medium' | 'high' | 'critical'
        failureProbability: number
        predictedIssues: { issue: string; probability: number; timeframe: string; impact: string }[]
        recommendedActions: { action: string; urgency: 'immediate' | 'soon' | 'scheduled'; estimatedCost: number; preventsSavings: number }[]
        maintenanceScore: number
        nextRecommendedService: string
        costSavingsIfActedNow: number
      }) => {
        const eq = equipmentWithHistory[p.equipmentIndex - 1]
        if (!eq) return null

        return {
          equipmentId: eq.id,
          equipmentName: eq.name,
          riskLevel: p.riskLevel,
          failureProbability: p.failureProbability,
          predictedIssues: p.predictedIssues || [],
          recommendedActions: p.recommendedActions || [],
          maintenanceScore: p.maintenanceScore,
          nextRecommendedService: p.nextRecommendedService,
          costSavingsIfActedNow: p.costSavingsIfActedNow || 0
        }
      }).filter(Boolean)

      insights = aiResult.insights || []

    } catch {
      // Fallback: generate predictions based on simple rules
      insights.push('AI analysis unavailable, using rule-based predictions')

      predictions = equipmentWithHistory.map(eq => {
        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
        let failureProbability = 10
        let maintenanceScore = 90

        // Age-based risk
        if (eq.age >= 15) {
          riskLevel = 'high'
          failureProbability += 40
          maintenanceScore -= 30
        } else if (eq.age >= 10) {
          riskLevel = 'medium'
          failureProbability += 20
          maintenanceScore -= 15
        }

        // Service history based risk
        if (eq.monthsSinceService >= 24) {
          if (riskLevel === 'low') riskLevel = 'medium'
          else if (riskLevel === 'medium') riskLevel = 'high'
          else riskLevel = 'critical'
          failureProbability += 25
          maintenanceScore -= 20
        } else if (eq.monthsSinceService >= 12) {
          failureProbability += 10
          maintenanceScore -= 10
        }

        maintenanceScore = Math.max(0, Math.min(100, maintenanceScore))
        failureProbability = Math.min(95, failureProbability)

        const predictedIssues: { issue: string; probability: number; timeframe: string; impact: string }[] = []
        const recommendedActions: { action: string; urgency: 'immediate' | 'soon' | 'scheduled'; estimatedCost: number; preventsSavings: number }[] = []

        if (eq.type.toLowerCase().includes('hvac') || eq.type.toLowerCase().includes('ac')) {
          if (eq.monthsSinceService >= 12) {
            predictedIssues.push({
              issue: 'Refrigerant leak',
              probability: 30 + eq.age * 2,
              timeframe: '3-6 months',
              impact: 'major'
            })
            recommendedActions.push({
              action: 'Schedule AC tune-up and refrigerant check',
              urgency: eq.monthsSinceService >= 18 ? 'soon' : 'scheduled' as const,
              estimatedCost: 150,
              preventsSavings: 800
            })
          }
          if (eq.age >= 10) {
            predictedIssues.push({
              issue: 'Compressor wear',
              probability: 20 + (eq.age - 10) * 5,
              timeframe: '6-12 months',
              impact: 'major'
            })
          }
        }

        if (eq.type.toLowerCase().includes('water heater')) {
          if (eq.age >= 8) {
            predictedIssues.push({
              issue: 'Tank corrosion',
              probability: 40 + (eq.age - 8) * 10,
              timeframe: '1-2 years',
              impact: 'major'
            })
            recommendedActions.push({
              action: 'Inspect anode rod and flush tank',
              urgency: eq.age >= 12 ? 'immediate' : 'soon' as const,
              estimatedCost: 200,
              preventsSavings: 1500
            })
          }
        }

        if (predictedIssues.length === 0) {
          predictedIssues.push({
            issue: 'Normal wear and tear',
            probability: 15,
            timeframe: '12+ months',
            impact: 'minor'
          })
        }

        if (recommendedActions.length === 0) {
          recommendedActions.push({
            action: 'Schedule routine maintenance',
            urgency: 'scheduled' as const,
            estimatedCost: 100,
            preventsSavings: 300
          })
        }

        return {
          equipmentId: eq.id,
          equipmentName: eq.name,
          riskLevel,
          failureProbability,
          predictedIssues,
          recommendedActions,
          maintenanceScore,
          nextRecommendedService: eq.monthsSinceService >= 12 ? 'Within 30 days' : 'Within 6 months',
          costSavingsIfActedNow: riskLevel === 'critical' ? 2000 : riskLevel === 'high' ? 1000 : riskLevel === 'medium' ? 500 : 200
        }
      })
    }

    // Sort by risk level
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    predictions.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel])

    // Calculate summary
    const summary = {
      totalEquipment: predictions.length,
      criticalCount: predictions.filter(p => p.riskLevel === 'critical').length,
      highRiskCount: predictions.filter(p => p.riskLevel === 'high').length,
      totalPotentialSavings: predictions.reduce((sum, p) => sum + p.costSavingsIfActedNow, 0),
      avgMaintenanceScore: predictions.length > 0
        ? Math.round(predictions.reduce((sum, p) => sum + p.maintenanceScore, 0) / predictions.length)
        : 0
    }

    return NextResponse.json({
      predictions,
      summary,
      insights
    })
  } catch (error) {
    console.error('Predictive maintenance error:', error)
    // Return a helpful error response instead of crashing
    return NextResponse.json({
      error: 'Failed to analyze equipment',
      message: error instanceof Error ? error.message : 'Unknown error',
      predictions: [],
      summary: {
        totalEquipment: 0,
        criticalCount: 0,
        highRiskCount: 0,
        totalPotentialSavings: 0,
        avgMaintenanceScore: 0
      },
      insights: ['Analysis failed - please try again']
    }, { status: 500 })
  }
}
