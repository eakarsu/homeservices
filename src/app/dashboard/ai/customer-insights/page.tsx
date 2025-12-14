'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  SparklesIcon,
  UserGroupIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  StarIcon,
  ClockIcon,
  ArrowPathIcon,
  BeakerIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  totalSpent: number
  jobCount: number
  lastServiceDate: string | null
  memberSince: string
}

interface CustomerInsight {
  customerId: string
  customerName: string
  lifetimeValue: number
  predictedAnnualValue: number
  churnRisk: 'low' | 'medium' | 'high'
  churnProbability: number
  segment: 'VIP' | 'Regular' | 'At Risk' | 'New' | 'Dormant'
  recommendations: {
    action: string
    priority: 'high' | 'medium' | 'low'
    expectedImpact: string
    timing: string
  }[]
  opportunities: {
    service: string
    likelihood: number
    estimatedValue: number
    reason: string
  }[]
  healthScore: number
  engagementTrend: 'increasing' | 'stable' | 'decreasing'
  keyMetrics: {
    avgJobValue: number
    serviceFrequency: string
    paymentReliability: number
    referralPotential: number
  }
}

interface InsightsResult {
  insights: CustomerInsight[]
  summary: {
    totalCustomers: number
    atRiskCount: number
    vipCount: number
    totalOpportunityValue: number
    avgHealthScore: number
  }
  trends: string[]
}

// Sample data
const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Johnson Residence',
    totalSpent: 8500,
    jobCount: 12,
    lastServiceDate: '2024-10-15',
    memberSince: '2020-03-15'
  },
  {
    id: 'cust-2',
    name: 'Smith Commercial Properties',
    totalSpent: 45000,
    jobCount: 48,
    lastServiceDate: '2024-11-20',
    memberSince: '2019-06-01'
  },
  {
    id: 'cust-3',
    name: 'Williams Family',
    totalSpent: 2200,
    jobCount: 4,
    lastServiceDate: '2024-03-10',
    memberSince: '2023-01-20'
  },
  {
    id: 'cust-4',
    name: 'Brown Office Complex',
    totalSpent: 15000,
    jobCount: 20,
    lastServiceDate: '2024-09-05',
    memberSince: '2021-08-10'
  }
]

export default function CustomerInsightsPage() {
  const router = useRouter()
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [analysisType, setAnalysisType] = useState<'all' | 'selected'>('all')
  const [sampleMode, setSampleMode] = useState(false)

  const loadSampleData = () => {
    setSampleMode(true)
    setAnalysisType('all')
  }

  const { data: customers = [], isLoading: loadingCustomers } = useQuery<Customer[]>({
    queryKey: ['customers-for-insights'],
    queryFn: async () => {
      const res = await fetch('/api/customers?limit=100')
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data = await res.json()
      return data.customers?.map((c: { id: string; firstName?: string; lastName?: string; companyName?: string; createdAt: string }) => ({
        id: c.id,
        name: c.firstName ? `${c.firstName} ${c.lastName}` : c.companyName || 'Unknown',
        totalSpent: Math.floor(Math.random() * 10000) + 500,
        jobCount: Math.floor(Math.random() * 20) + 1,
        lastServiceDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        memberSince: c.createdAt?.split('T')[0] || '2023-01-01'
      })) || []
    },
    enabled: !sampleMode
  })

  const displayCustomers = sampleMode ? SAMPLE_CUSTOMERS : customers

  const insightsMutation = useMutation({
    mutationFn: async () => {
      const customersToAnalyze = analysisType === 'selected' && selectedCustomers.length > 0
        ? displayCustomers.filter(c => selectedCustomers.includes(c.id))
        : displayCustomers

      const res = await fetch('/api/ai/customer-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customersData: customersToAnalyze,
          useSampleData: sampleMode
        })
      })
      if (!res.ok) throw new Error('Failed to analyze customers')
      return res.json() as Promise<InsightsResult>
    }
  })

  const result = insightsMutation.data

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'VIP': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'Regular': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'At Risk': return 'bg-red-100 text-red-800 border-red-300'
      case 'New': return 'bg-green-100 text-green-800 border-green-300'
      case 'Dormant': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getChurnColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      default: return 'text-green-600'
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
              AI Customer Insights
            </h1>
            <p className="text-gray-500">
              AI-powered customer analysis for retention, upselling, and lifetime value predictions
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
                All Customers
              </button>
              <button
                onClick={() => setAnalysisType('selected')}
                className={cn(
                  'px-4 py-2 rounded-lg border-2 font-medium transition-colors',
                  analysisType === 'selected'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                Selected Only
              </button>
            </div>
          </div>

          <button
            onClick={() => insightsMutation.mutate()}
            disabled={insightsMutation.isPending || displayCustomers.length === 0}
            className="btn-primary px-6 py-2 flex items-center gap-2"
          >
            {insightsMutation.isPending ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Generate Insights
              </>
            )}
          </button>
        </div>

        {/* Customer Selection */}
        {analysisType === 'selected' && (
          <div className="mt-4 pt-4 border-t">
            <label className="label">Select Customers to Analyze</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {displayCustomers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomers(prev =>
                    prev.includes(customer.id)
                      ? prev.filter(id => id !== customer.id)
                      : [...prev, customer.id]
                  )}
                  className={cn(
                    'p-2 rounded-lg border text-left text-sm transition-colors',
                    selectedCustomers.includes(customer.id)
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <p className="font-medium truncate">{customer.name}</p>
                  <p className="text-xs text-gray-500">${customer.totalSpent.toLocaleString()} lifetime</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{result.summary.totalCustomers}</p>
                <p className="text-xs text-gray-500">Analyzed</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <StarIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-purple-600">{result.summary.vipCount}</p>
                <p className="text-xs text-gray-500">VIP Customers</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-600">{result.summary.atRiskCount}</p>
                <p className="text-xs text-gray-500">At Risk</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">${result.summary.totalOpportunityValue.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Opportunity</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ChartBarIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-yellow-600">{result.summary.avgHealthScore}%</p>
                <p className="text-xs text-gray-500">Avg Health</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends */}
      {result && result.trends.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5" />
            AI-Generated Trends & Insights
          </h3>
          <ul className="space-y-2">
            {result.trends.map((trend, i) => (
              <li key={i} className="text-blue-800 text-sm flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {trend}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Loading State */}
      {insightsMutation.isPending && (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Analyzing customer data with AI...</p>
        </div>
      )}

      {/* Empty State */}
      {!result && !insightsMutation.isPending && (
        <div className="card text-center py-12">
          <UserGroupIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Analyze</h3>
          <p className="text-gray-500">Click &quot;Generate Insights&quot; to get AI-powered customer analysis</p>
        </div>
      )}

      {/* Customer Insights */}
      {result && result.insights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Customer Analysis</h3>

          {result.insights.map((insight) => (
            <div
              key={insight.customerId}
              className={cn(
                'card border-2',
                insight.churnRisk === 'high' ? 'border-red-200 bg-red-50' :
                insight.segment === 'VIP' ? 'border-purple-200 bg-purple-50' :
                'border-gray-200'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-semibold text-gray-900">{insight.customerName}</h4>
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full border',
                      getSegmentColor(insight.segment)
                    )}>
                      {insight.segment}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>Lifetime Value: <strong className="text-gray-900">${insight.lifetimeValue.toLocaleString()}</strong></span>
                    <span>Predicted Annual: <strong className="text-green-600">${insight.predictedAnnualValue.toLocaleString()}</strong></span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {insight.engagementTrend === 'increasing' ? (
                      <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                    ) : insight.engagementTrend === 'decreasing' ? (
                      <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
                    ) : (
                      <ChartBarIcon className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-500 capitalize">{insight.engagementTrend}</span>
                  </div>
                  <p className={cn('text-sm font-medium', getChurnColor(insight.churnRisk))}>
                    {insight.churnProbability}% churn risk
                  </p>
                </div>
              </div>

              {/* Health Score */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Customer Health Score</span>
                  <span className="font-medium">{insight.healthScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      'h-2 rounded-full',
                      insight.healthScore >= 80 ? 'bg-green-500' :
                      insight.healthScore >= 60 ? 'bg-yellow-500' :
                      insight.healthScore >= 40 ? 'bg-orange-500' :
                      'bg-red-500'
                    )}
                    style={{ width: `${insight.healthScore}%` }}
                  />
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-white rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">${insight.keyMetrics.avgJobValue}</p>
                  <p className="text-xs text-gray-500">Avg Job Value</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{insight.keyMetrics.serviceFrequency}</p>
                  <p className="text-xs text-gray-500">Service Freq</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{insight.keyMetrics.paymentReliability}%</p>
                  <p className="text-xs text-gray-500">Payment Score</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{insight.keyMetrics.referralPotential}%</p>
                  <p className="text-xs text-gray-500">Referral Potential</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recommendations */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                    Recommended Actions
                  </h5>
                  <div className="space-y-2">
                    {insight.recommendations.map((rec, i) => (
                      <div key={i} className="p-2 bg-white rounded border text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{rec.action}</span>
                          <span className={cn(
                            'px-2 py-0.5 text-xs rounded-full',
                            rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          )}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {rec.expectedImpact} • {rec.timing}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opportunities */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
                    <CurrencyDollarIcon className="w-4 h-4 text-green-500" />
                    Upsell Opportunities
                  </h5>
                  <div className="space-y-2">
                    {insight.opportunities.map((opp, i) => (
                      <div key={i} className="p-2 bg-white rounded border text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{opp.service}</span>
                          <span className="text-green-600 font-medium">${opp.estimatedValue}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">{opp.reason}</span>
                          <span className="text-xs text-blue-600">{opp.likelihood}% likely</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
