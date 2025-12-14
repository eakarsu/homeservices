'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Part {
  id: string
  partNumber: string
  name: string
  category: string
}

interface TruckStock {
  id: string
  partId: string
  quantity: number
  minQuantity: number
  part: Part
}

interface Truck {
  id: string
  name: string
  vehicleId: string
  stock: TruckStock[]
}

export default function TechInventoryPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [adjustingPart, setAdjustingPart] = useState<string | null>(null)
  const [adjustQty, setAdjustQty] = useState(1)
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferPart, setTransferPart] = useState<TruckStock | null>(null)

  const { data: myTruck, isLoading } = useQuery<Truck>({
    queryKey: ['my-truck'],
    queryFn: async () => {
      const res = await fetch('/api/technicians/my-truck?includeStock=true')
      if (!res.ok) throw new Error('Failed to fetch truck')
      return res.json()
    }
  })

  const adjustMutation = useMutation({
    mutationFn: async ({ partId, quantity, reason }: { partId: string; quantity: number; reason: string }) => {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          truckId: myTruck?.id,
          partId,
          quantity,
          reason
        })
      })
      if (!res.ok) throw new Error('Failed to adjust inventory')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-truck'] })
      setAdjustingPart(null)
      setAdjustQty(1)
    }
  })

  const categories = myTruck?.stock
    ? Array.from(new Set(myTruck.stock.map(s => s.part.category)))
    : []

  const filteredStock = myTruck?.stock?.filter(stock => {
    const matchesSearch = !search ||
      stock.part.name.toLowerCase().includes(search.toLowerCase()) ||
      stock.part.partNumber.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !selectedCategory || stock.part.category === selectedCategory
    return matchesSearch && matchesCategory
  }) || []

  const lowStockItems = filteredStock.filter(s => s.quantity <= s.minQuantity)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!myTruck) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No truck assigned to your account.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Truck Inventory</h1>
        <p className="text-sm text-gray-500">{myTruck.name} ({myTruck.vehicleId})</p>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-800">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="font-medium">{lowStockItems.length} items low on stock</span>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search parts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !selectedCategory
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory List */}
      <div className="space-y-2">
        {filteredStock.map(stock => (
          <div
            key={stock.id}
            className={`bg-white rounded-lg border p-4 ${
              stock.quantity <= stock.minQuantity ? 'border-yellow-300' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{stock.part.name}</p>
                <p className="text-sm text-gray-500">{stock.part.partNumber}</p>
                <p className="text-xs text-gray-400">{stock.part.category}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    stock.quantity <= stock.minQuantity ? 'text-yellow-600' : 'text-gray-900'
                  }`}>
                    {stock.quantity}
                  </p>
                  <p className="text-xs text-gray-500">Min: {stock.minQuantity}</p>
                </div>

                {adjustingPart === stock.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustMutation.mutate({
                        partId: stock.partId,
                        quantity: -adjustQty,
                        reason: 'Used on job'
                      })}
                      disabled={adjustMutation.isPending}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      <MinusIcon className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                      className="w-12 text-center border border-gray-300 rounded"
                    />
                    <button
                      onClick={() => adjustMutation.mutate({
                        partId: stock.partId,
                        quantity: adjustQty,
                        reason: 'Restocked'
                      })}
                      disabled={adjustMutation.isPending}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setAdjustingPart(null)}
                      className="text-sm text-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAdjustingPart(stock.id)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <ArrowsRightLeftIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredStock.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No parts found
          </div>
        )}
      </div>
    </div>
  )
}
