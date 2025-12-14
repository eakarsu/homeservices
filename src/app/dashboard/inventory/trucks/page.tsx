'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  TruckIcon,
  PlusIcon,
  MinusIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline'

interface TruckStock {
  id: string
  quantity: number
  minQuantity: number
  maxQuantity?: number
  part: {
    id: string
    partNumber: string
    name: string
    category?: string
  }
}

interface Truck {
  id: string
  name: string
  vehicleId?: string
  make?: string
  model?: string
  technicians: Array<{
    user: { firstName: string; lastName: string }
  }>
  stock: TruckStock[]
}

export default function TruckInventoryPage() {
  const queryClient = useQueryClient()
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferData, setTransferData] = useState({
    fromTruckId: '',
    toTruckId: '',
    partId: '',
    quantity: 1,
  })

  const { data: trucks, isLoading } = useQuery<Truck[]>({
    queryKey: ['trucks-inventory'],
    queryFn: async () => {
      const res = await fetch('/api/trucks?includeStock=true')
      if (!res.ok) throw new Error('Failed to fetch trucks')
      return res.json()
    },
  })

  const { data: parts } = useQuery({
    queryKey: ['parts-list'],
    queryFn: async () => {
      const res = await fetch('/api/parts')
      if (!res.ok) throw new Error('Failed to fetch parts')
      return res.json()
    },
  })

  const adjustStockMutation = useMutation({
    mutationFn: async ({ truckId, partId, adjustment }: { truckId: string; partId: string; adjustment: number }) => {
      const res = await fetch(`/api/trucks/${truckId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partId, adjustment }),
      })
      if (!res.ok) throw new Error('Failed to adjust stock')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks-inventory'] })
    },
  })

  const transferMutation = useMutation({
    mutationFn: async (data: typeof transferData) => {
      const res = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to transfer stock')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks-inventory'] })
      setShowTransferModal(false)
      setTransferData({ fromTruckId: '', toTruckId: '', partId: '', quantity: 1 })
    },
  })

  const activeTruck = trucks?.find(t => t.id === selectedTruck)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventory" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Truck Inventory</h1>
            <p className="text-sm text-gray-500">{trucks?.length || 0} trucks</p>
          </div>
        </div>
        <button
          onClick={() => setShowTransferModal(true)}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowsRightLeftIcon className="w-4 h-4" />
          Transfer Stock
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Truck List */}
          <div className="space-y-2">
            <h2 className="font-semibold text-gray-700 mb-3">Select Truck</h2>
            {trucks?.map((truck) => {
              const lowStockCount = truck.stock.filter(s => s.quantity <= s.minQuantity).length
              const techName = truck.technicians[0]
                ? `${truck.technicians[0].user.firstName} ${truck.technicians[0].user.lastName}`
                : 'Unassigned'
              return (
                <button
                  key={truck.id}
                  onClick={() => setSelectedTruck(truck.id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedTruck === truck.id
                      ? 'bg-primary-50 border-2 border-primary-500'
                      : 'bg-white border border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TruckIcon className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium">{truck.name}</p>
                      <p className="text-sm text-gray-500">{techName}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-500">{truck.stock.length} items</span>
                    {lowStockCount > 0 && (
                      <span className="text-orange-600 font-medium">{lowStockCount} low</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Stock Details */}
          <div className="lg:col-span-3">
            {activeTruck ? (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">{activeTruck.name} Stock</h2>
                  <p className="text-sm text-gray-500">
                    {activeTruck.make} {activeTruck.model}
                    {activeTruck.vehicleId && ` • ${activeTruck.vehicleId}`}
                  </p>
                </div>

                {activeTruck.stock.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b uppercase">
                        <th className="pb-2">Part</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2 text-center">Min</th>
                        <th className="pb-2 text-center">Qty</th>
                        <th className="pb-2 text-center">Adjust</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTruck.stock.map((item) => (
                        <tr
                          key={item.id}
                          className={`border-b last:border-0 ${
                            item.quantity <= item.minQuantity ? 'bg-orange-50' : ''
                          }`}
                        >
                          <td className="py-3">
                            <p className="font-medium">{item.part.name}</p>
                            <p className="text-xs text-gray-500">{item.part.partNumber}</p>
                          </td>
                          <td className="py-3">
                            <span className="text-sm text-gray-600">
                              {item.part.category || '-'}
                            </span>
                          </td>
                          <td className="py-3 text-center text-sm text-gray-500">
                            {item.minQuantity}
                          </td>
                          <td className="py-3 text-center">
                            <span className={`font-bold ${
                              item.quantity <= item.minQuantity ? 'text-orange-600' : 'text-gray-900'
                            }`}>
                              {item.quantity}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => adjustStockMutation.mutate({
                                  truckId: activeTruck.id,
                                  partId: item.part.id,
                                  adjustment: -1,
                                })}
                                disabled={item.quantity <= 0 || adjustStockMutation.isPending}
                                className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50"
                              >
                                <MinusIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => adjustStockMutation.mutate({
                                  truckId: activeTruck.id,
                                  partId: item.part.id,
                                  adjustment: 1,
                                })}
                                disabled={adjustStockMutation.isPending}
                                className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200 disabled:opacity-50"
                              >
                                <PlusIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No stock assigned to this truck
                  </p>
                )}
              </div>
            ) : (
              <div className="card text-center py-12">
                <TruckIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Truck</h3>
                <p className="text-gray-500">Choose a truck from the list to view its inventory</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Transfer Stock</h2>
            <div className="space-y-4">
              <div>
                <label className="label">From Truck</label>
                <select
                  value={transferData.fromTruckId}
                  onChange={(e) => setTransferData({ ...transferData, fromTruckId: e.target.value })}
                  className="input"
                >
                  <option value="">Select truck...</option>
                  {trucks?.map((truck) => (
                    <option key={truck.id} value={truck.id}>{truck.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">To Truck</label>
                <select
                  value={transferData.toTruckId}
                  onChange={(e) => setTransferData({ ...transferData, toTruckId: e.target.value })}
                  className="input"
                >
                  <option value="">Select truck...</option>
                  {trucks?.filter(t => t.id !== transferData.fromTruckId).map((truck) => (
                    <option key={truck.id} value={truck.id}>{truck.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Part</label>
                <select
                  value={transferData.partId}
                  onChange={(e) => setTransferData({ ...transferData, partId: e.target.value })}
                  className="input"
                >
                  <option value="">Select part...</option>
                  {parts?.map((part: { id: string; name: string; partNumber: string }) => (
                    <option key={part.id} value={part.id}>{part.name} ({part.partNumber})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Quantity</label>
                <input
                  type="number"
                  value={transferData.quantity}
                  onChange={(e) => setTransferData({ ...transferData, quantity: parseInt(e.target.value) || 1 })}
                  className="input"
                  min="1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowTransferModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => transferMutation.mutate(transferData)}
                disabled={!transferData.fromTruckId || !transferData.toTruckId || !transferData.partId || transferMutation.isPending}
                className="btn-primary"
              >
                {transferMutation.isPending ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
