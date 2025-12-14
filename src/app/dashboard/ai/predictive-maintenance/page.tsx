'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowPathIcon,
  BeakerIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Equipment {
  id: string
  name: string
  type: string
  age: number
  lastService: string | null
  customerId: string
  customerName: string
  address: string
}

interface PredictionResult {
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
}

interface AnalysisResult {
  predictions: PredictionResult[]
  summary: {
    totalEquipment: number
    criticalCount: number
    highRiskCount: number
    totalPotentialSavings: number
    avgMaintenanceScore: number
  }
  insights: string[]
}

// Sample data for demonstration
const SAMPLE_EQUIPMENT: Equipment[] = [
  // Customer 1 - Johnson Residence (multiple equipment)
  {
    id: 'eq-1',
    name: 'Carrier 24ACC636A003 - Central AC',
    type: 'Central Air Conditioning',
    age: 12,
    lastService: '2024-06-15',
    customerId: 'cust-1',
    customerName: 'Johnson Residence',
    address: '1234 Palm Dr, Phoenix, AZ'
  },
  {
    id: 'eq-4',
    name: 'Rheem Water Heater 50 Gal',
    type: 'Water Heater',
    age: 8,
    lastService: '2024-03-10',
    customerId: 'cust-1',
    customerName: 'Johnson Residence',
    address: '1234 Palm Dr, Phoenix, AZ'
  },
  {
    id: 'eq-5',
    name: 'Goodman Furnace GMSS96',
    type: 'Gas Furnace',
    age: 10,
    lastService: '2024-01-22',
    customerId: 'cust-1',
    customerName: 'Johnson Residence',
    address: '1234 Palm Dr, Phoenix, AZ'
  },
  // Customer 2 - Smith Commercial
  {
    id: 'eq-2',
    name: 'Trane XR15 - Heat Pump',
    type: 'Heat Pump',
    age: 8,
    lastService: '2024-09-20',
    customerId: 'cust-2',
    customerName: 'Smith Commercial',
    address: '5678 Central Ave, Phoenix, AZ'
  },
  // Customer 3 - Williams Home
  {
    id: 'eq-3',
    name: 'Lennox XC21 - AC Unit',
    type: 'Central Air Conditioning',
    age: 3,
    lastService: '2024-10-01',
    customerId: 'cust-3',
    customerName: 'Williams Home',
    address: '9012 Camelback Rd, Phoenix, AZ'
  }
]

const SAMPLE_ANALYSIS: AnalysisResult = {
  predictions: [
    {
      equipmentId: 'eq-1',
      equipmentName: 'Carrier 24ACC636A003 - Central AC',
      riskLevel: 'critical',
      failureProbability: 78,
      predictedIssues: [
        {
          issue: 'Compressor failure',
          probability: 65,
          timeframe: '30-60 days',
          impact: 'Complete system shutdown'
        },
        {
          issue: 'Capacitor degradation',
          probability: 80,
          timeframe: '14-30 days',
          impact: 'Intermittent cooling failures'
        },
        {
          issue: 'Refrigerant leak',
          probability: 45,
          timeframe: '60-90 days',
          impact: 'Reduced cooling efficiency'
        }
      ],
      recommendedActions: [
        {
          action: 'Replace dual run capacitor',
          urgency: 'immediate',
          estimatedCost: 185,
          preventsSavings: 1200
        },
        {
          action: 'Full system inspection and refrigerant check',
          urgency: 'immediate',
          estimatedCost: 250,
          preventsSavings: 3500
        },
        {
          action: 'Consider system replacement (end of life)',
          urgency: 'soon',
          estimatedCost: 6500,
          preventsSavings: 2000
        }
      ],
      maintenanceScore: 35,
      nextRecommendedService: 'Within 7 days',
      costSavingsIfActedNow: 4700
    },
    {
      equipmentId: 'eq-2',
      equipmentName: 'Trane XR15 - Heat Pump',
      riskLevel: 'medium',
      failureProbability: 32,
      predictedIssues: [
        {
          issue: 'Defrost board malfunction',
          probability: 40,
          timeframe: '90-120 days',
          impact: 'Heating inefficiency in winter'
        },
        {
          issue: 'Contactor wear',
          probability: 35,
          timeframe: '60-90 days',
          impact: 'Startup issues'
        }
      ],
      recommendedActions: [
        {
          action: 'Inspect and clean contactor',
          urgency: 'scheduled',
          estimatedCost: 95,
          preventsSavings: 450
        },
        {
          action: 'Test defrost board operation',
          urgency: 'soon',
          estimatedCost: 150,
          preventsSavings: 800
        }
      ],
      maintenanceScore: 68,
      nextRecommendedService: 'Within 30 days',
      costSavingsIfActedNow: 1250
    },
    {
      equipmentId: 'eq-3',
      equipmentName: 'Lennox XC21 - AC Unit',
      riskLevel: 'low',
      failureProbability: 8,
      predictedIssues: [
        {
          issue: 'Filter replacement needed',
          probability: 90,
          timeframe: '0-14 days',
          impact: 'Minor efficiency reduction'
        }
      ],
      recommendedActions: [
        {
          action: 'Replace air filter',
          urgency: 'scheduled',
          estimatedCost: 25,
          preventsSavings: 75
        },
        {
          action: 'Annual maintenance service',
          urgency: 'scheduled',
          estimatedCost: 175,
          preventsSavings: 300
        }
      ],
      maintenanceScore: 92,
      nextRecommendedService: 'Spring 2025',
      costSavingsIfActedNow: 375
    }
  ],
  summary: {
    totalEquipment: 3,
    criticalCount: 1,
    highRiskCount: 0,
    totalPotentialSavings: 6325,
    avgMaintenanceScore: 65
  },
  insights: [
    'The Carrier unit at Johnson Residence is at critical risk and should be prioritized for immediate service',
    '1 out of 3 units is past expected lifespan (12+ years) - recommend discussing replacement options',
    'Regular maintenance on the Lennox XC21 has kept it in excellent condition - great candidate for service agreement',
    'Proactive maintenance on all 3 units could save customers approximately $6,325 in emergency repair costs'
  ]
}

export default function PredictiveMaintenancePage() {
  const router = useRouter()
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [analysisType, setAnalysisType] = useState<'all' | 'customer'>('all')
  const [sampleMode, setSampleMode] = useState(false)
  const [sampleResult, setSampleResult] = useState<AnalysisResult | null>(null)

  const loadSampleData = () => {
    setSampleMode(true)
    setAnalysisType('customer')
    setSelectedCustomerId('cust-1') // Select first sample customer
    setSampleResult(null) // Don't show results - user must click "Run Prediction Analysis" to call OpenRouter
  }

  const { data: equipment = [], isLoading: loadingEquipment } = useQuery<Equipment[]>({
    queryKey: ['equipment-list'],
    queryFn: async () => {
      const res = await fetch('/api/equipment?includeCustomer=true')
      if (!res.ok) throw new Error('Failed to fetch equipment')
      return res.json()
    },
    enabled: !sampleMode
  })

  // Use sample or real equipment
  const displayEquipment = sampleMode ? SAMPLE_EQUIPMENT : equipment

  const analysisMutation = useMutation({
    mutationFn: async () => {
      setSampleResult(null)

      // If in sample mode, send sample equipment data to OpenRouter for real AI analysis
      if (sampleMode) {
        const equipmentToAnalyze = analysisType === 'customer'
          ? SAMPLE_EQUIPMENT.filter(e => e.customerId === selectedCustomerId)
          : SAMPLE_EQUIPMENT

        const res = await fetch('/api/ai/predictive-maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            equipmentData: equipmentToAnalyze,
            useSampleData: true
          })
        })
        if (!res.ok) throw new Error('Failed to analyze equipment')
        return res.json() as Promise<AnalysisResult>
      }

      // Normal mode - fetch real equipment from database
      const res = await fetch('/api/ai/predictive-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: analysisType === 'customer' ? selectedCustomerId : undefined,
          analyzeAll: analysisType === 'all'
        })
      })
      if (!res.ok) throw new Error('Failed to analyze equipment')
      return res.json() as Promise<AnalysisResult>
    }
  })

  const result = sampleResult || analysisMutation.data
  const customers = Array.from(new Map(displayEquipment.map(e => [e.customerId, { id: e.customerId, name: e.customerName }])).values())

  // Filter equipment based on selection
  const filteredEquipment = analysisType === 'customer' && selectedCustomerId
    ? displayEquipment.filter(e => e.customerId === selectedCustomerId)
    : displayEquipment

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-green-100 text-green-800 border-green-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/dashboard/ai')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to AI Features"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="w-7 h-7 text-primary-600" />
              Predictive Maintenance
            </h1>
            <p className="text-gray-500">
              AI-powered equipment failure prediction based on age, service history, and usage patterns
            </p>
          </div>
        </div>
        <button
          onClick={loadSampleData}
          className="btn-secondary flex items-center gap-2"
        >
          <BeakerIcon className="w-5 h-5" />
          Load Sample Data
        </button>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">Analysis Scope</label>
            <div className="flex gap-2">
              <button
                onClick={() => setAnalysisType('all')}
                className={cn(
                  'px-4 py-2 rounded-lg border-2 font-medium transition-colors',
                  analysisType === 'all'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                All Equipment
              </button>
              <button
                onClick={() => setAnalysisType('customer')}
                className={cn(
                  'px-4 py-2 rounded-lg border-2 font-medium transition-colors',
                  analysisType === 'customer'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                By Customer
              </button>
            </div>
          </div>

          {analysisType === 'customer' && (
            <div className="flex-1 min-w-64">
              <label className="label">Select Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="input"
              >
                <option value="">Choose a customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => analysisMutation.mutate()}
            disabled={analysisMutation.isPending || (analysisType === 'customer' && !selectedCustomerId)}
            className="btn-primary px-6 py-2 flex items-center gap-2"
          >
            {analysisMutation.isPending ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Run Prediction Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Customer Equipment List - Show when customer is selected */}
      {analysisType === 'customer' && selectedCustomerId && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Equipment for {selectedCustomer?.name || 'Selected Customer'}
            </h3>
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              {filteredEquipment.length} items
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredEquipment.map((eq) => (
              <div key={eq.id} className="p-3 bg-gray-50 rounded-lg border">
                <p className="font-medium text-gray-900 text-sm">{eq.name}</p>
                <p className="text-xs text-gray-500">{eq.type}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Age: {eq.age} years</span>
                  <span>Last service: {eq.lastService ? format(new Date(eq.lastService), 'MMM d, yyyy') : 'Never'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <WrenchScrewdriverIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredEquipment.length}</p>
              <p className="text-sm text-gray-500">
                {analysisType === 'customer' ? 'Customer Equipment' : 'Total Equipment'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {result?.summary.criticalCount || 0}
              </p>
              <p className="text-sm text-gray-500">Critical Risk</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                ${result?.summary.totalPotentialSavings?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-500">Potential Savings</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {result?.summary.avgMaintenanceScore || '--'}%
              </p>
              <p className="text-sm text-gray-500">Avg Health Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {!result && !analysisMutation.isPending && (
        <div className="card text-center py-12">
          <ChartBarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ready to Analyze
          </h3>
          <p className="text-gray-500">
            Click &quot;Run Prediction Analysis&quot; to identify equipment at risk of failure
          </p>
        </div>
      )}

      {analysisMutation.isPending && (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Analyzing equipment data and predicting maintenance needs...</p>
        </div>
      )}

      {result && (
        <>
          {/* Insights */}
          {result.insights.length > 0 && (
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                AI Insights
              </h3>
              <ul className="space-y-2">
                {result.insights.map((insight, i) => (
                  <li key={i} className="text-blue-800 text-sm flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Predictions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {analysisType === 'customer' && selectedCustomer
                ? `Maintenance Predictions for ${selectedCustomer.name}`
                : 'Equipment Predictions'}
            </h3>

            {result.predictions.length === 0 ? (
              <div className="card text-center py-8 text-gray-500">
                No equipment found for analysis
              </div>
            ) : (
              result.predictions.map((prediction) => (
                <div
                  key={prediction.equipmentId}
                  className={cn(
                    'card border-2',
                    prediction.riskLevel === 'critical' ? 'border-red-300 bg-red-50' :
                    prediction.riskLevel === 'high' ? 'border-orange-300 bg-orange-50' :
                    prediction.riskLevel === 'medium' ? 'border-yellow-200' :
                    'border-gray-200'
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{prediction.equipmentName}</h4>
                      <p className="text-sm text-gray-500">
                        Next service: {prediction.nextRecommendedService}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        'px-3 py-1 rounded-full text-sm font-medium border',
                        getRiskColor(prediction.riskLevel)
                      )}>
                        {prediction.riskLevel.toUpperCase()} RISK
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        {prediction.failureProbability}% failure probability
                      </p>
                    </div>
                  </div>

                  {/* Maintenance Score */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Maintenance Health Score</span>
                      <span className="font-medium">{prediction.maintenanceScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={cn(
                          'h-2 rounded-full',
                          prediction.maintenanceScore >= 80 ? 'bg-green-500' :
                          prediction.maintenanceScore >= 60 ? 'bg-yellow-500' :
                          prediction.maintenanceScore >= 40 ? 'bg-orange-500' :
                          'bg-red-500'
                        )}
                        style={{ width: `${prediction.maintenanceScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Predicted Issues */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
                        Predicted Issues
                      </h5>
                      <div className="space-y-2">
                        {prediction.predictedIssues.map((issue, i) => (
                          <div key={i} className="p-2 bg-white rounded border">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{issue.issue}</span>
                              <span className="text-xs text-gray-500">{issue.probability}% likely</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Timeframe: {issue.timeframe} | Impact: {issue.impact}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Actions */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                        <WrenchScrewdriverIcon className="w-4 h-4 text-blue-500" />
                        Recommended Actions
                      </h5>
                      <div className="space-y-2">
                        {prediction.recommendedActions.map((action, i) => (
                          <div key={i} className="p-2 bg-white rounded border">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{action.action}</span>
                              <span className={cn(
                                'px-2 py-0.5 text-xs rounded-full',
                                action.urgency === 'immediate' ? 'bg-red-100 text-red-700' :
                                action.urgency === 'soon' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              )}>
                                {action.urgency}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Cost: ${action.estimatedCost} | Saves: ${action.preventsSavings}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Savings CTA */}
                  {prediction.costSavingsIfActedNow > 0 && (
                    <div className="mt-4 p-3 bg-green-100 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                        <span className="text-green-800 font-medium">
                          Act now to save ${prediction.costSavingsIfActedNow.toLocaleString()}
                        </span>
                      </div>
                      <button className="btn-primary text-sm">
                        Schedule Service
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
