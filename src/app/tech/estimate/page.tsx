'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface PricebookItem {
  id: string
  code: string
  name: string
  description: string
  category: string
  type: string
  unitPrice: number
  laborMinutes: number
}

interface LineItem {
  id: string
  pricebookItemId: string
  name: string
  description: string
  quantity: number
  unitPrice: number
  tier: 'GOOD' | 'BETTER' | 'BEST'
}

export default function TechEstimatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  const customerId = searchParams.get('customerId')

  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [activeTier, setActiveTier] = useState<'GOOD' | 'BETTER' | 'BEST'>('BETTER')
  const [searchQuery, setSearchQuery] = useState('')
  const [showPricebook, setShowPricebook] = useState(false)
  const [notes, setNotes] = useState('')

  const { data: pricebookItems = [] } = useQuery<PricebookItem[]>({
    queryKey: ['pricebook', searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/pricebook?search=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) throw new Error('Failed to fetch pricebook')
      return res.json()
    }
  })

  const createEstimateMutation = useMutation({
    mutationFn: async (data: { jobId?: string; customerId?: string; items: LineItem[]; notes: string }) => {
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create estimate')
      return res.json()
    },
    onSuccess: (data) => {
      if (jobId) {
        router.push(`/tech/job/${jobId}`)
      } else {
        router.back()
      }
    }
  })

  const addItem = (item: PricebookItem) => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      pricebookItemId: item.id,
      name: item.name,
      description: item.description,
      quantity: 1,
      unitPrice: item.unitPrice,
      tier: activeTier
    }
    setLineItems([...lineItems, newItem])
    setShowPricebook(false)
    setSearchQuery('')
  }

  const removeItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id))
  }

  const updateItemQuantity = (id: string, quantity: number) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
    ))
  }

  const getItemsByTier = (tier: 'GOOD' | 'BETTER' | 'BEST') => {
    return lineItems.filter(item => item.tier === tier)
  }

  const getTierTotal = (tier: 'GOOD' | 'BETTER' | 'BEST') => {
    return getItemsByTier(tier).reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  }

  const handleSubmit = () => {
    createEstimateMutation.mutate({
      jobId: jobId || undefined,
      customerId: customerId || undefined,
      items: lineItems,
      notes
    })
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Estimate</h1>
          <p className="text-sm text-gray-500">Good / Better / Best pricing</p>
        </div>
      </div>

      {/* Tier Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-1 flex">
        {(['GOOD', 'BETTER', 'BEST'] as const).map((tier) => (
          <button
            key={tier}
            onClick={() => setActiveTier(tier)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTier === tier
                ? tier === 'GOOD'
                  ? 'bg-blue-600 text-white'
                  : tier === 'BETTER'
                  ? 'bg-green-600 text-white'
                  : 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tier} (${getTierTotal(tier).toFixed(0)})
          </button>
        ))}
      </div>

      {/* Current Tier Items */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{activeTier} Option Items</h3>
          <button
            onClick={() => setShowPricebook(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            Add
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {getItemsByTier(activeTier).map((item) => (
            <div key={item.id} className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500 truncate">{item.description}</p>
                <p className="text-sm font-medium text-gray-900">
                  ${item.unitPrice.toFixed(2)} each
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600"
                >
                  +
                </button>
              </div>

              <p className="w-20 text-right font-bold text-gray-900">
                ${(item.unitPrice * item.quantity).toFixed(2)}
              </p>

              <button
                onClick={() => removeItem(item.id)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}

          {getItemsByTier(activeTier).length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No items added to {activeTier} option</p>
              <p className="text-sm">Tap "Add" to add items from pricebook</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes for Customer
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Add any notes or recommendations..."
        />
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">Estimate Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blue-600 font-medium">Good Option:</span>
            <span className="font-bold">${getTierTotal('GOOD').toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-600 font-medium">Better Option:</span>
            <span className="font-bold">${getTierTotal('BETTER').toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-purple-600 font-medium">Best Option:</span>
            <span className="font-bold">${getTierTotal('BEST').toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={lineItems.length === 0 || createEstimateMutation.isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CheckCircleIcon className="w-5 h-5" />
        {createEstimateMutation.isPending ? 'Creating...' : 'Create Estimate'}
      </button>

      {/* Pricebook Modal */}
      {showPricebook && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">Add from Pricebook</h3>
                <button
                  onClick={() => {
                    setShowPricebook(false)
                    setSearchQuery('')
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {pricebookItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItem(item)}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.code} - {item.category}</p>
                      </div>
                      <p className="font-bold text-gray-900">${item.unitPrice.toFixed(2)}</p>
                    </div>
                  </button>
                ))}

                {pricebookItems.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No items found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
