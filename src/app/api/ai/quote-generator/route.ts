import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'

import { callAI } from '@/lib/ai'

interface QuoteRequest {
  tradeType: string
  service: string
  customerName: string
  propertySize?: number
  additionalNotes?: string
  useSampleData?: boolean
}

interface QuoteOption {
  tier: 'good' | 'better' | 'best'
  name: string
  description: string
  laborCost: number
  partsCost: number
  totalCost: number
  warranty: string
  estimatedDuration: string
  features: string[]
  savings?: string
  recommended?: boolean
}

interface QuoteResult {
  customerName: string
  jobDescription: string
  options: QuoteOption[]
  validUntil: string
  notes: string[]
  termsAndConditions: string[]
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: QuoteRequest = await request.json()
    const { tradeType, service, customerName, propertySize, additionalNotes } = body

    if (!service || !customerName) {
      return NextResponse.json({ error: 'Service and customer name are required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert pricing specialist for a home services company (HVAC, plumbing, electrical).
Generate professional Good/Better/Best quote options based on the service requested.
Consider industry standard pricing, parts quality tiers, warranty levels, and customer value.
The "better" option should be marked as recommended if it offers the best value.
Always respond with valid JSON.`

    const userPrompt = `Generate a professional quote for:

Service Type: ${tradeType}
Service Requested: ${service}
Customer Name: ${customerName}
${propertySize ? `Property Size: ${propertySize} sq ft` : ''}
${additionalNotes ? `Additional Notes: ${additionalNotes}` : ''}

Provide a complete quote in this exact JSON format:
{
  "customerName": "${customerName}",
  "jobDescription": "Brief description of the job",
  "options": [
    {
      "tier": "good",
      "name": "Option name (e.g., Standard, Basic)",
      "description": "Short description",
      "laborCost": number,
      "partsCost": number,
      "totalCost": number,
      "warranty": "warranty terms",
      "estimatedDuration": "time estimate",
      "features": ["array of included features"]
    },
    {
      "tier": "better",
      "name": "Option name (e.g., High Efficiency, Premium)",
      "description": "Short description",
      "laborCost": number,
      "partsCost": number,
      "totalCost": number,
      "warranty": "warranty terms",
      "estimatedDuration": "time estimate",
      "features": ["array of included features"],
      "savings": "Annual savings description if applicable",
      "recommended": true
    },
    {
      "tier": "best",
      "name": "Option name (e.g., Premium, Ultimate)",
      "description": "Short description",
      "laborCost": number,
      "partsCost": number,
      "totalCost": number,
      "warranty": "warranty terms",
      "estimatedDuration": "time estimate",
      "features": ["array of included features"],
      "savings": "Annual savings description if applicable"
    }
  ],
  "validUntil": "30 days from quote date",
  "notes": ["array of important notes about the quote"],
  "termsAndConditions": ["array of terms"]
}`

    let quoteResult: QuoteResult

    try {
      const response = await callAI(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        { temperature: 0.4, maxTokens: 3000 }
      )

      quoteResult = JSON.parse(response)

      // Ensure required fields
      quoteResult.customerName = quoteResult.customerName || customerName
      quoteResult.validUntil = quoteResult.validUntil || '30 days from quote date'
      quoteResult.notes = quoteResult.notes || []
      quoteResult.termsAndConditions = quoteResult.termsAndConditions || [
        'Quote valid for 30 days',
        '50% deposit required to schedule',
        'Final inspection may be required'
      ]

      // Ensure options have all required fields
      quoteResult.options = (quoteResult.options || []).map(option => ({
        ...option,
        tier: option.tier || 'good',
        name: option.name || 'Standard Option',
        description: option.description || '',
        laborCost: option.laborCost || 0,
        partsCost: option.partsCost || 0,
        totalCost: option.totalCost || (option.laborCost || 0) + (option.partsCost || 0),
        warranty: option.warranty || '1 year parts and labor',
        estimatedDuration: option.estimatedDuration || '2-4 hours',
        features: option.features || []
      }))

    } catch {
      // Fallback quote generation based on service type
      const basePrice = getBasePrice(service)

      quoteResult = {
        customerName,
        jobDescription: `${service} - ${tradeType} service`,
        options: [
          {
            tier: 'good',
            name: 'Standard',
            description: 'Basic service with standard equipment',
            laborCost: Math.round(basePrice * 0.3),
            partsCost: Math.round(basePrice * 0.7),
            totalCost: basePrice,
            warranty: '1 year parts, 90 days labor',
            estimatedDuration: '2-4 hours',
            features: [
              'Standard grade equipment',
              'Basic installation',
              'System testing included'
            ]
          },
          {
            tier: 'better',
            name: 'Premium',
            description: 'Enhanced service with upgraded equipment',
            laborCost: Math.round(basePrice * 1.2 * 0.3),
            partsCost: Math.round(basePrice * 1.2 * 0.7),
            totalCost: Math.round(basePrice * 1.2),
            warranty: '5 years parts, 1 year labor',
            estimatedDuration: '3-5 hours',
            features: [
              'Premium grade equipment',
              'Enhanced installation',
              'Extended warranty',
              'System testing and optimization'
            ],
            savings: 'Potential energy savings',
            recommended: true
          },
          {
            tier: 'best',
            name: 'Ultimate',
            description: 'Top-tier service with best-in-class equipment',
            laborCost: Math.round(basePrice * 1.6 * 0.35),
            partsCost: Math.round(basePrice * 1.6 * 0.65),
            totalCost: Math.round(basePrice * 1.6),
            warranty: '10 years parts, 2 years labor',
            estimatedDuration: '4-6 hours',
            features: [
              'Best-in-class equipment',
              'Full professional installation',
              'Lifetime equipment warranty available',
              'Comprehensive testing',
              'Follow-up inspection included'
            ],
            savings: 'Maximum energy savings'
          }
        ],
        validUntil: '30 days from quote date',
        notes: [
          'AI quote generation unavailable, using estimated pricing',
          'Prices may vary based on site conditions',
          'Permit fees may apply'
        ],
        termsAndConditions: [
          'Quote valid for 30 days',
          '50% deposit required to schedule',
          'Final inspection may be required'
        ]
      }
    }

    return NextResponse.json(quoteResult)
  } catch (error) {
    console.error('Quote generator error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getBasePrice(service: string): number {
  const basePrices: Record<string, number> = {
    'AC Unit Replacement': 4500,
    'Furnace Installation': 3500,
    'Duct Cleaning': 350,
    'AC Tune-Up': 150,
    'Heat Pump Installation': 5500,
    'Thermostat Installation': 250,
    'Water Heater Replacement': 1500,
    'Drain Cleaning': 200,
    'Pipe Repair': 350,
    'Faucet Installation': 175,
    'Toilet Replacement': 400,
    'Sump Pump Installation': 800,
    'Panel Upgrade': 2500,
    'Outlet Installation': 150,
    'Ceiling Fan Installation': 200,
    'Whole House Surge Protector': 350,
    'EV Charger Installation': 1200,
    'Recessed Lighting': 800,
    'Home Inspection': 400,
    'Maintenance Agreement': 300,
    'Emergency Service Call': 150
  }

  return basePrices[service] || 500
}
