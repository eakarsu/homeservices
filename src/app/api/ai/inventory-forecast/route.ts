import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'

import { callAI } from '@/lib/ai'

interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  currentStock: number
  reorderPoint: number
  unitCost: number
  avgMonthlyUsage: number
  lastRestocked: string
}

interface ForecastRequest {
  inventoryData: InventoryItem[]
  forecastPeriod: number
  category: string
  useSampleData?: boolean
}

interface ForecastResult {
  forecasts: {
    itemId: string
    itemName: string
    sku: string
    currentStock: number
    predictedUsage30Days: number
    predictedUsage90Days: number
    daysUntilStockout: number
    recommendedOrderQty: number
    recommendedOrderDate: string
    urgency: 'critical' | 'high' | 'medium' | 'low'
    trend: 'increasing' | 'stable' | 'decreasing'
    seasonalFactor: string
    confidenceScore: number
  }[]
  summary: {
    totalItems: number
    criticalItems: number
    totalReorderValue: number
    avgDaysToStockout: number
  }
  insights: string[]
  recommendations: {
    action: string
    priority: 'high' | 'medium' | 'low'
    potentialSavings: number
    reason: string
  }[]
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ForecastRequest = await request.json()
    const { inventoryData, forecastPeriod } = body

    if (!inventoryData || inventoryData.length === 0) {
      return NextResponse.json({ error: 'Inventory data is required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert inventory management AI for a home services company.
Analyze inventory data to predict usage, identify stockout risks, and recommend optimal reorder quantities.
Consider seasonality (HVAC parts peak in summer, plumbing in winter), usage patterns, and lead times.
Current month: ${new Date().toLocaleString('default', { month: 'long' })}
Always respond with valid JSON.`

    const userPrompt = `Analyze this inventory and forecast needs for ${forecastPeriod} days:

${inventoryData.map((item, i) => `${i + 1}. ${item.name}
   SKU: ${item.sku}
   Category: ${item.category}
   Current Stock: ${item.currentStock}
   Reorder Point: ${item.reorderPoint}
   Unit Cost: $${item.unitCost}
   Avg Monthly Usage: ${item.avgMonthlyUsage}
   Last Restocked: ${item.lastRestocked}
`).join('\n')}

Generate a forecast in this exact JSON format:
{
  "forecasts": [
    {
      "itemId": "item id",
      "itemName": "item name",
      "sku": "sku",
      "currentStock": number,
      "predictedUsage30Days": number,
      "predictedUsage90Days": number,
      "daysUntilStockout": number,
      "recommendedOrderQty": number,
      "recommendedOrderDate": "date string",
      "urgency": "critical" | "high" | "medium" | "low",
      "trend": "increasing" | "stable" | "decreasing",
      "seasonalFactor": "description of seasonal impact",
      "confidenceScore": number (0-100)
    }
  ],
  "summary": {
    "totalItems": number,
    "criticalItems": number (items with critical/high urgency),
    "totalReorderValue": number (total cost to reorder all recommended items),
    "avgDaysToStockout": number
  },
  "insights": ["array of key insights about the inventory"],
  "recommendations": [
    {
      "action": "what to do",
      "priority": "high" | "medium" | "low",
      "potentialSavings": number,
      "reason": "why this recommendation"
    }
  ]
}`

    let forecastResult: ForecastResult

    try {
      const response = await callAI(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        { temperature: 0.3, maxTokens: 4000 }
      )

      forecastResult = JSON.parse(response)

      // Ensure required fields
      forecastResult.forecasts = forecastResult.forecasts || []
      forecastResult.summary = forecastResult.summary || {
        totalItems: inventoryData.length,
        criticalItems: 0,
        totalReorderValue: 0,
        avgDaysToStockout: 30
      }
      forecastResult.insights = forecastResult.insights || []
      forecastResult.recommendations = forecastResult.recommendations || []

    } catch {
      // Fallback forecast generation
      const forecasts = inventoryData.map(item => {
        const dailyUsage = item.avgMonthlyUsage / 30
        const daysUntilStockout = Math.max(0, Math.floor(item.currentStock / dailyUsage))
        const predictedUsage30Days = Math.ceil(dailyUsage * 30)
        const predictedUsage90Days = Math.ceil(dailyUsage * 90)

        let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low'
        if (daysUntilStockout <= 7) urgency = 'critical'
        else if (daysUntilStockout <= 14) urgency = 'high'
        else if (daysUntilStockout <= 30) urgency = 'medium'

        const recommendedOrderQty = Math.max(item.reorderPoint * 2 - item.currentStock, 0)
        const orderDate = new Date()
        orderDate.setDate(orderDate.getDate() + Math.max(0, daysUntilStockout - 7))

        return {
          itemId: item.id,
          itemName: item.name,
          sku: item.sku,
          currentStock: item.currentStock,
          predictedUsage30Days,
          predictedUsage90Days,
          daysUntilStockout,
          recommendedOrderQty,
          recommendedOrderDate: orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          urgency,
          trend: 'stable' as const,
          seasonalFactor: item.category === 'HVAC Parts' ? 'Peak season approaching' : 'Normal demand expected',
          confidenceScore: 75
        }
      })

      const criticalItems = forecasts.filter(f => f.urgency === 'critical' || f.urgency === 'high').length
      const totalReorderValue = forecasts.reduce((sum, f) => {
        const item = inventoryData.find(i => i.id === f.itemId)
        return sum + (f.recommendedOrderQty * (item?.unitCost || 0))
      }, 0)

      forecastResult = {
        forecasts: forecasts.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout),
        summary: {
          totalItems: inventoryData.length,
          criticalItems,
          totalReorderValue: Math.round(totalReorderValue),
          avgDaysToStockout: Math.round(forecasts.reduce((sum, f) => sum + f.daysUntilStockout, 0) / forecasts.length)
        },
        insights: [
          'AI analysis unavailable, using rule-based forecasting',
          `${criticalItems} items require immediate attention`,
          'Review usage patterns to improve forecast accuracy'
        ],
        recommendations: [
          {
            action: 'Order critical items immediately',
            priority: 'high',
            potentialSavings: 0,
            reason: `${criticalItems} items are at risk of stockout within 14 days`
          },
          {
            action: 'Set up automatic reorder alerts',
            priority: 'medium',
            potentialSavings: 200,
            reason: 'Avoid emergency ordering premiums'
          }
        ]
      }
    }

    return NextResponse.json(forecastResult)
  } catch (error) {
    console.error('Inventory forecast error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
