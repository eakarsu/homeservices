'use client'

import { useState } from 'react'
import { ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface Recommendation {
  agreementId: string
  customerName: string
  recommendedDate: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  reasoning: string
}

export default function SubscriptionHealthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [scanned, setScanned] = useState<number>(0)

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/ai/subscription-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 25 }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`)
      setRecommendations(j.recommendations || [])
      setScanned(j._meta?.scanned || 0)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChartBarIcon className="w-7 h-7 text-emerald-500" />
            Subscription Health Monitor
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Scan active service-agreement plans + equipment age and propose preventive
            visits.
          </p>
        </div>
        <button onClick={run} disabled={loading} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Scanning...' : 'Scan plans'}
        </button>
      </div>

      {error && <div className="rounded bg-red-50 border border-red-200 p-2 text-sm text-red-700">{error}</div>}

      {scanned > 0 && (
        <p className="text-xs text-gray-500">Scanned {scanned} active agreement(s)</p>
      )}

      <div className="space-y-2">
        {recommendations.map((r) => (
          <div
            key={r.agreementId}
            className={`card border-l-4 ${
              r.priority === 'HIGH'
                ? 'border-red-500'
                : r.priority === 'MEDIUM'
                ? 'border-amber-500'
                : 'border-emerald-500'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{r.customerName}</p>
                <p className="text-xs text-gray-500">Agreement {r.agreementId}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">{r.recommendedDate}</p>
                <p className="text-xs text-gray-500">Priority: {r.priority}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-2">{r.reasoning}</p>
          </div>
        ))}
        {recommendations.length === 0 && !loading && (
          <p className="text-sm text-gray-500">No recommendations yet. Click "Scan plans".</p>
        )}
      </div>
    </div>
  )
}
