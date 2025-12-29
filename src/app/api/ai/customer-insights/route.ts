import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'

import { callAI } from '@/lib/ai'

interface CustomerData {
  id: string
  name: string
  totalSpent: number
  jobCount: number
  lastServiceDate: string | null
  memberSince: string
}

interface InsightsRequest {
  customersData: CustomerData[]
  useSampleData?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: InsightsRequest = await request.json()
    const { customersData } = body

    if (!customersData || customersData.length === 0) {
      return NextResponse.json({
        insights: [],
        summary: {
          totalCustomers: 0,
          atRiskCount: 0,
          vipCount: 0,
          totalOpportunityValue: 0,
          avgHealthScore: 0
        },
        trends: ['No customers to analyze']
      })
    }

    const systemPrompt = `You are an expert customer analytics AI for a home services company (HVAC, plumbing, electrical).
Analyze customer data to identify:
- Customer segments (VIP, Regular, At Risk, New, Dormant)
- Churn risk and probability
- Upsell/cross-sell opportunities
- Retention recommendations
- Lifetime value predictions

Always respond with valid JSON. Be specific and actionable in recommendations.`

    const userPrompt = `Analyze these customers:

${customersData.map((c, i) => `${i + 1}. ${c.name}
   - Total Spent: $${c.totalSpent}
   - Jobs Completed: ${c.jobCount}
   - Last Service: ${c.lastServiceDate || 'Never'}
   - Member Since: ${c.memberSince}
`).join('\n')}

Provide analysis in this JSON format:
{
  "insights": [
    {
      "customerIndex": number,
      "lifetimeValue": number,
      "predictedAnnualValue": number,
      "churnRisk": "low" | "medium" | "high",
      "churnProbability": number (0-100),
      "segment": "VIP" | "Regular" | "At Risk" | "New" | "Dormant",
      "recommendations": [
        {
          "action": "string",
          "priority": "high" | "medium" | "low",
          "expectedImpact": "string",
          "timing": "string"
        }
      ],
      "opportunities": [
        {
          "service": "string",
          "likelihood": number (0-100),
          "estimatedValue": number,
          "reason": "string"
        }
      ],
      "healthScore": number (0-100),
      "engagementTrend": "increasing" | "stable" | "decreasing",
      "keyMetrics": {
        "avgJobValue": number,
        "serviceFrequency": "string",
        "paymentReliability": number (0-100),
        "referralPotential": number (0-100)
      }
    }
  ],
  "trends": ["string array of overall business insights"]
}`

    let insights: {
      customerId: string
      customerName: string
      lifetimeValue: number
      predictedAnnualValue: number
      churnRisk: 'low' | 'medium' | 'high'
      churnProbability: number
      segment: 'VIP' | 'Regular' | 'At Risk' | 'New' | 'Dormant'
      recommendations: { action: string; priority: 'high' | 'medium' | 'low'; expectedImpact: string; timing: string }[]
      opportunities: { service: string; likelihood: number; estimatedValue: number; reason: string }[]
      healthScore: number
      engagementTrend: 'increasing' | 'stable' | 'decreasing'
      keyMetrics: { avgJobValue: number; serviceFrequency: string; paymentReliability: number; referralPotential: number }
    }[] = []
    let trends: string[] = []

    try {
      const response = await callAI(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        { temperature: 0.4, maxTokens: 4000 }
      )

      const aiResult = JSON.parse(response)

      insights = (aiResult.insights || []).map((insight: {
        customerIndex: number
        lifetimeValue: number
        predictedAnnualValue: number
        churnRisk: 'low' | 'medium' | 'high'
        churnProbability: number
        segment: 'VIP' | 'Regular' | 'At Risk' | 'New' | 'Dormant'
        recommendations: { action: string; priority: 'high' | 'medium' | 'low'; expectedImpact: string; timing: string }[]
        opportunities: { service: string; likelihood: number; estimatedValue: number; reason: string }[]
        healthScore: number
        engagementTrend: 'increasing' | 'stable' | 'decreasing'
        keyMetrics: { avgJobValue: number; serviceFrequency: string; paymentReliability: number; referralPotential: number }
      }) => {
        const customer = customersData[insight.customerIndex - 1]
        if (!customer) return null

        return {
          customerId: customer.id,
          customerName: customer.name,
          lifetimeValue: insight.lifetimeValue || customer.totalSpent,
          predictedAnnualValue: insight.predictedAnnualValue || Math.round(customer.totalSpent / 2),
          churnRisk: insight.churnRisk || 'medium',
          churnProbability: insight.churnProbability || 30,
          segment: insight.segment || 'Regular',
          recommendations: insight.recommendations || [],
          opportunities: insight.opportunities || [],
          healthScore: insight.healthScore || 70,
          engagementTrend: insight.engagementTrend || 'stable',
          keyMetrics: insight.keyMetrics || {
            avgJobValue: customer.jobCount > 0 ? Math.round(customer.totalSpent / customer.jobCount) : 0,
            serviceFrequency: 'Quarterly',
            paymentReliability: 85,
            referralPotential: 50
          }
        }
      }).filter(Boolean)

      trends = aiResult.trends || []

    } catch {
      // Fallback analysis
      trends.push('AI analysis unavailable, using rule-based insights')

      insights = customersData.map(customer => {
        const avgJobValue = customer.jobCount > 0 ? Math.round(customer.totalSpent / customer.jobCount) : 0
        const daysSinceService = customer.lastServiceDate
          ? Math.floor((Date.now() - new Date(customer.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24))
          : 365

        let segment: 'VIP' | 'Regular' | 'At Risk' | 'New' | 'Dormant' = 'Regular'
        let churnRisk: 'low' | 'medium' | 'high' = 'medium'
        let churnProbability = 30
        let healthScore = 70

        if (customer.totalSpent >= 10000) {
          segment = 'VIP'
          churnRisk = 'low'
          churnProbability = 10
          healthScore = 90
        } else if (daysSinceService > 180) {
          segment = 'Dormant'
          churnRisk = 'high'
          churnProbability = 70
          healthScore = 30
        } else if (daysSinceService > 90) {
          segment = 'At Risk'
          churnRisk = 'high'
          churnProbability = 50
          healthScore = 50
        } else if (customer.jobCount <= 2) {
          segment = 'New'
          churnRisk = 'medium'
          churnProbability = 40
          healthScore = 60
        }

        return {
          customerId: customer.id,
          customerName: customer.name,
          lifetimeValue: customer.totalSpent,
          predictedAnnualValue: Math.round(customer.totalSpent * 0.4),
          churnRisk,
          churnProbability,
          segment,
          recommendations: [
            {
              action: daysSinceService > 60 ? 'Send re-engagement email' : 'Schedule maintenance reminder',
              priority: churnRisk === 'high' ? 'high' : 'medium' as const,
              expectedImpact: 'Improve retention',
              timing: 'This week'
            }
          ],
          opportunities: [
            {
              service: 'Annual Maintenance Agreement',
              likelihood: 60,
              estimatedValue: 350,
              reason: 'Based on service history'
            }
          ],
          healthScore,
          engagementTrend: daysSinceService > 90 ? 'decreasing' : 'stable' as const,
          keyMetrics: {
            avgJobValue,
            serviceFrequency: customer.jobCount >= 4 ? 'Quarterly' : 'Annual',
            paymentReliability: 85,
            referralPotential: segment === 'VIP' ? 80 : 40
          }
        }
      })
    }

    // Sort by health score (lowest first to prioritize at-risk)
    insights.sort((a, b) => a.healthScore - b.healthScore)

    const summary = {
      totalCustomers: insights.length,
      atRiskCount: insights.filter(i => i.segment === 'At Risk' || i.segment === 'Dormant').length,
      vipCount: insights.filter(i => i.segment === 'VIP').length,
      totalOpportunityValue: insights.reduce((sum, i) => sum + i.opportunities.reduce((s, o) => s + o.estimatedValue, 0), 0),
      avgHealthScore: insights.length > 0 ? Math.round(insights.reduce((sum, i) => sum + i.healthScore, 0) / insights.length) : 0
    }

    return NextResponse.json({
      insights,
      summary,
      trends
    })
  } catch (error) {
    console.error('Customer insights error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
