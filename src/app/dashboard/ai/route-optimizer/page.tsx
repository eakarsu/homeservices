'use client'

import { useState } from 'react'
import { TruckIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface RouteResult {
  optimizedOrder: string[]
  totalDistance: number
  totalTime: number
  savings: { distance: number; time: number }
  reasoning: string
}

export default function RouteOptimizerPage() {
  const [technicianId, setTechnicianId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RouteResult | null>(null)

  async function run() {
    if (!technicianId.trim()) {
      setError('technicianId is required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/ai/optimize-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId, date }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`)
      setResult(j)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TruckIcon className="w-7 h-7 text-cyan-500" />
          Route Optimizer
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Reorder a technician&apos;s daily jobs into the most efficient sequence.
        </p>
      </div>

      <div className="card grid grid-cols-3 gap-2 text-sm">
        <div>
          <label className="block font-medium mb-1">Technician ID</label>
          <input
            className="w-full border rounded px-2 py-1"
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            placeholder="paste a Technician.id"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Date</label>
          <input
            type="date"
            className="w-full border rounded px-2 py-1"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button onClick={run} disabled={loading} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Optimizing...' : 'Optimize'}
          </button>
        </div>
      </div>

      {error && <div className="rounded bg-red-50 border border-red-200 p-2 text-sm text-red-700">{error}</div>}

      {result && (
        <div className="card space-y-3 text-sm">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Total distance</p>
              <p className="font-semibold">{result.totalDistance} mi</p>
            </div>
            <div className="rounded bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Total time</p>
              <p className="font-semibold">{result.totalTime} min</p>
            </div>
            <div className="rounded bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700">Savings</p>
              <p className="font-semibold">
                {result.savings.distance} mi / {result.savings.time} min
              </p>
            </div>
          </div>
          <div>
            <p className="font-medium mb-1">Optimised order</p>
            <ol className="list-decimal pl-6 text-xs">
              {result.optimizedOrder.map((id, i) => (
                <li key={i} className="font-mono">{id}</li>
              ))}
            </ol>
          </div>
          <div>
            <p className="font-medium mb-1">Reasoning</p>
            <p className="text-gray-700">{result.reasoning}</p>
          </div>
        </div>
      )}
    </div>
  )
}
