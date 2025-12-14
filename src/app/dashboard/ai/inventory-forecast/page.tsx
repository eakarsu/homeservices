'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import {
  SparklesIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  BeakerIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

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

const SAMPLE_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Dual Run Capacitor 45/5 MFD',
    sku: 'CAP-45-5',
    category: 'HVAC Parts',
    currentStock: 8,
    reorderPoint: 10,
    unitCost: 45,
    avgMonthlyUsage: 12,
    lastRestocked: '2024-10-15'
  },
  {
    id: 'inv-2',
    name: 'R-410A Refrigerant (25lb)',
    sku: 'REF-410A-25',
    category: 'HVAC Parts',
    currentStock: 3,
    reorderPoint: 5,
    unitCost: 285,
    avgMonthlyUsage: 4,
    lastRestocked: '2024-09-20'
  },
  {
    id: 'inv-3',
    name: 'Contactor 40A 24V',
    sku: 'CON-40-24',
    category: 'HVAC Parts',
    currentStock: 15,
    reorderPoint: 8,
    unitCost: 35,
    avgMonthlyUsage: 6,
    lastRestocked: '2024-11-01'
  },
  {
    id: 'inv-4',
    name: 'Water Heater Element 4500W',
    sku: 'WHE-4500',
    category: 'Plumbing Parts',
    currentStock: 4,
    reorderPoint: 6,
    unitCost: 28,
    avgMonthlyUsage: 5,
    lastRestocked: '2024-10-25'
  },
  {
    id: 'inv-5',
    name: '1/4 HP Condensate Pump',
    sku: 'PUMP-COND-25',
    category: 'HVAC Parts',
    currentStock: 6,
    reorderPoint: 4,
    unitCost: 95,
    avgMonthlyUsage: 3,
    lastRestocked: '2024-11-10'
  },
  {
    id: 'inv-6',
    name: 'Circuit Breaker 20A',
    sku: 'CB-20A',
    category: 'Electrical Parts',
    currentStock: 25,
    reorderPoint: 15,
    unitCost: 12,
    avgMonthlyUsage: 8,
    lastRestocked: '2024-11-15'
  },
  {
    id: 'inv-7',
    name: 'Flapper Valve Universal',
    sku: 'FLAP-UNI',
    category: 'Plumbing Parts',
    currentStock: 2,
    reorderPoint: 10,
    unitCost: 8,
    avgMonthlyUsage: 15,
    lastRestocked: '2024-09-01'
  }
]

export default function InventoryForecastPage() {
  const router = useRouter()
  const [forecastPeriod, setForecastPeriod] = useState<30 | 60 | 90>(30)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sampleMode, setSampleMode] = useState(false)

  const categories = ['all', 'HVAC Parts', 'Plumbing Parts', 'Electrical Parts']

  const loadSampleData = () => {
    setSampleMode(true)
    setForecastPeriod(30)
    setSelectedCategory('all')
  }

  const displayInventory = sampleMode
    ? selectedCategory === 'all'
      ? SAMPLE_INVENTORY
      : SAMPLE_INVENTORY.filter(i => i.category === selectedCategory)
    : []

  const forecastMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ai/inventory-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryData: displayInventory,
          forecastPeriod,
          category: selectedCategory,
          useSampleData: sampleMode
        })
      })
      if (!res.ok) throw new Error('Failed to generate forecast')
      return res.json() as Promise<ForecastResult>
    }
  })

  const result = forecastMutation.data

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-green-100 text-green-800 border-green-300'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-red-500" />
      case 'decreasing':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-green-500" />
      default:
        return <span className="text-gray-400">—</span>
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
              <CubeIcon className="w-7 h-7 text-primary-600" />
              AI Inventory Forecasting
            </h1>
            <p className="text-gray-500">
              Predict inventory needs and optimize reorder timing
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
            <label className="label">Forecast Period</label>
            <div className="flex gap-2">
              {[30, 60, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setForecastPeriod(days as 30 | 60 | 90)}
                  className={cn(
                    'px-4 py-2 rounded-lg border-2 font-medium transition-colors',
                    forecastPeriod === days
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-48">
            <label className="label">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => forecastMutation.mutate()}
            disabled={forecastMutation.isPending || !sampleMode}
            className="btn-primary px-6 py-2 flex items-center gap-2"
          >
            {forecastMutation.isPending ? (
              <>
                <SparklesIcon className="w-5 h-5 animate-pulse" />
                Forecasting...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Generate Forecast
              </>
            )}
          </button>
        </div>
      </div>

      {/* Current Inventory */}
      {sampleMode && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Inventory</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-500">Item</th>
                  <th className="text-left py-2 text-gray-500">SKU</th>
                  <th className="text-left py-2 text-gray-500">Category</th>
                  <th className="text-center py-2 text-gray-500">Stock</th>
                  <th className="text-center py-2 text-gray-500">Reorder Point</th>
                  <th className="text-right py-2 text-gray-500">Unit Cost</th>
                  <th className="text-center py-2 text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayInventory.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-900">{item.name}</td>
                    <td className="py-2 text-gray-600">{item.sku}</td>
                    <td className="py-2 text-gray-600">{item.category}</td>
                    <td className="py-2 text-center">
                      <span className={cn(
                        'font-medium',
                        item.currentStock <= item.reorderPoint ? 'text-red-600' : 'text-gray-900'
                      )}>
                        {item.currentStock}
                      </span>
                    </td>
                    <td className="py-2 text-center text-gray-600">{item.reorderPoint}</td>
                    <td className="py-2 text-right text-gray-600">${item.unitCost}</td>
                    <td className="py-2 text-center">
                      {item.currentStock <= item.reorderPoint ? (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Low Stock</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results */}
      {!result && !forecastMutation.isPending && !sampleMode && (
        <div className="card text-center py-12">
          <ChartBarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Load Sample Data to Get Started
          </h3>
          <p className="text-gray-500">
            Click &quot;Load Sample Data&quot; to see inventory forecasting in action
          </p>
        </div>
      )}

      {!result && !forecastMutation.isPending && sampleMode && (
        <div className="card text-center py-12">
          <ChartBarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ready to Forecast
          </h3>
          <p className="text-gray-500">
            Click &quot;Generate Forecast&quot; to predict inventory needs
          </p>
        </div>
      )}

      {forecastMutation.isPending && (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Analyzing usage patterns and generating forecasts...</p>
        </div>
      )}

      {result && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CubeIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{result.summary.totalItems}</p>
                  <p className="text-sm text-gray-500">Items Analyzed</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{result.summary.criticalItems}</p>
                  <p className="text-sm text-gray-500">Critical Items</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ShoppingCartIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${result.summary.totalReorderValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Reorder Value</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{result.summary.avgDaysToStockout}</p>
                  <p className="text-sm text-gray-500">Avg Days to Stockout</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
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

          {/* Forecasts */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {forecastPeriod}-Day Forecast
            </h3>
            <div className="space-y-3">
              {result.forecasts.map((forecast) => (
                <div
                  key={forecast.itemId}
                  className={cn(
                    'p-4 rounded-lg border-2',
                    forecast.urgency === 'critical' ? 'border-red-300 bg-red-50' :
                    forecast.urgency === 'high' ? 'border-orange-300 bg-orange-50' :
                    'border-gray-200'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{forecast.itemName}</h4>
                      <p className="text-sm text-gray-500">SKU: {forecast.sku}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border',
                        getUrgencyColor(forecast.urgency)
                      )}>
                        {forecast.urgency.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        {getTrendIcon(forecast.trend)}
                        <span>{forecast.trend}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Current Stock</p>
                      <p className="font-semibold text-gray-900">{forecast.currentStock} units</p>
                    </div>
                    <div>
                      <p className="text-gray-500">30-Day Usage</p>
                      <p className="font-semibold text-gray-900">{forecast.predictedUsage30Days} units</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Days Until Stockout</p>
                      <p className={cn(
                        'font-semibold',
                        forecast.daysUntilStockout <= 7 ? 'text-red-600' :
                        forecast.daysUntilStockout <= 14 ? 'text-orange-600' :
                        'text-gray-900'
                      )}>
                        {forecast.daysUntilStockout} days
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Recommended Order</p>
                      <p className="font-semibold text-gray-900">{forecast.recommendedOrderQty} units</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Order By</p>
                      <p className="font-semibold text-primary-600">{forecast.recommendedOrderDate}</p>
                    </div>
                  </div>

                  {forecast.seasonalFactor && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <CalendarDaysIcon className="w-3 h-3" />
                      {forecast.seasonalFactor}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                AI Recommendations
              </h3>
              <div className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{rec.action}</p>
                        <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          'px-2 py-0.5 text-xs rounded-full',
                          rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        )}>
                          {rec.priority} priority
                        </span>
                        {rec.potentialSavings > 0 && (
                          <p className="text-sm text-green-600 font-medium mt-1">
                            Save ${rec.potentialSavings}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button className="btn-primary flex-1 py-3">
              Generate Purchase Orders
            </button>
            <button className="btn-secondary flex-1 py-3">
              Export Forecast Report
            </button>
          </div>
        </>
      )}
    </div>
  )
}
