'use client'

import { useState } from 'react'
import { SparklesIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'

interface VisionResult {
  type: string
  make: string | null
  model: string | null
  serial: string | null
  capacity: string | null
  yearOfManufacture: number | null
  notes: string
  confidence: number
  equipmentId?: string | null
}

export default function PhotoIntakePage() {
  const [imageUrl, setImageUrl] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [tradeType, setTradeType] = useState('HVAC')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VisionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => setImageUrl(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function run() {
    if (!imageUrl) {
      setError('Please paste an image URL or pick a file')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const r = await fetch('/api/ai/photo-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, propertyId: propertyId || undefined, tradeType }),
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
          <SparklesIcon className="w-7 h-7 text-fuchsia-500" />
          Photo Intake (Vision AI)
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Snap an equipment nameplate; Claude vision extracts make/model/serial. With a
          property ID, an Equipment record is created automatically.
        </p>
      </div>

      <div className="card space-y-3">
        <div>
          <label className="text-sm font-medium block mb-1">Equipment photo</label>
          <input type="file" accept="image/*" onChange={handleFile} className="block" />
          <p className="text-xs text-gray-500 mt-1">or paste an https:// URL below</p>
          <input
            className="w-full border rounded px-2 py-1 mt-1 text-sm"
            placeholder="https://..."
            value={imageUrl.startsWith('data:') ? '' : imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium block mb-1">Property ID (optional)</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="auto-creates Equipment if set"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Trade hint</label>
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              value={tradeType}
              onChange={(e) => setTradeType(e.target.value)}
            >
              <option>HVAC</option>
              <option>PLUMBING</option>
              <option>ELECTRICAL</option>
            </select>
          </div>
        </div>
        <button
          disabled={loading}
          onClick={run}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          <ArrowUpTrayIcon className="w-4 h-4" />
          {loading ? 'Analyzing...' : 'Identify Equipment'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {imageUrl && (
        <div className="card">
          <p className="text-sm font-medium mb-2">Preview</p>
          <img src={imageUrl} alt="" className="max-h-64 rounded border" />
        </div>
      )}

      {result && (
        <div className="card grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Type:</span> {result.type}</div>
          <div><span className="text-gray-500">Make:</span> {result.make || '—'}</div>
          <div><span className="text-gray-500">Model:</span> {result.model || '—'}</div>
          <div><span className="text-gray-500">Serial:</span> {result.serial || '—'}</div>
          <div><span className="text-gray-500">Capacity:</span> {result.capacity || '—'}</div>
          <div><span className="text-gray-500">Year:</span> {result.yearOfManufacture ?? '—'}</div>
          <div className="col-span-2"><span className="text-gray-500">Notes:</span> {result.notes}</div>
          <div className="col-span-2"><span className="text-gray-500">Confidence:</span> {Math.round((result.confidence || 0) * 100)}%</div>
          {result.equipmentId && (
            <div className="col-span-2 text-emerald-700 font-medium">
              Created Equipment record {result.equipmentId}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
