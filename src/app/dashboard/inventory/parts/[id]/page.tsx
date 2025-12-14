'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CubeIcon,
  TruckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'

interface TruckStock {
  id: string
  quantity: number
  minQuantity: number
  truck: {
    id: string
    name: string
    vehicleId?: string
  }
}

interface Part {
  id: string
  partNumber: string
  name: string
  description?: string
  category?: string
  manufacturer?: string
  cost: number
  price: number
  quantityOnHand: number
  reorderLevel: number
  reorderQty: number
  warehouseLocation?: string
  isActive: boolean
  truckStock: TruckStock[]
}

export default function PartDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const partId = params.id as string
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Part>>({})

  const { data: part, isLoading } = useQuery<Part>({
    queryKey: ['part', partId],
    queryFn: async () => {
      const res = await fetch(`/api/parts/${partId}`)
      if (!res.ok) throw new Error('Failed to fetch part')
      return res.json()
    },
  })

  useEffect(() => {
    if (part) {
      setFormData({
        partNumber: part.partNumber,
        name: part.name,
        description: part.description || '',
        category: part.category || '',
        manufacturer: part.manufacturer || '',
        cost: part.cost,
        price: part.price,
        quantityOnHand: part.quantityOnHand,
        reorderLevel: part.reorderLevel,
        reorderQty: part.reorderQty,
        warehouseLocation: part.warehouseLocation || '',
      })
    }
  }, [part])

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Part>) => {
      const res = await fetch(`/api/parts/${partId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update part')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['part', partId] })
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      setIsEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/parts/${partId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete part')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      router.push('/dashboard/inventory/parts')
    },
  })

  const handleSave = () => {
    updateMutation.mutate(formData)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this part?')) {
      deleteMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!part) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Part not found</p>
        <Link href="/dashboard/inventory/parts" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to parts
        </Link>
      </div>
    )
  }

  const isLowStock = part.quantityOnHand <= part.reorderLevel
  const margin = part.price > 0 ? ((part.price - part.cost) / part.price * 100).toFixed(1) : '0'
  const totalWarehouseValue = part.cost * part.quantityOnHand
  const totalTruckStock = part.truckStock?.reduce((sum, ts) => sum + ts.quantity, 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventory/parts" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{part.name}</h1>
              {isLowStock && (
                <span className="badge bg-orange-100 text-orange-700 flex items-center gap-1">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  Low Stock
                </span>
              )}
            </div>
            <p className="text-gray-600">{part.partNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <PencilIcon className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="btn-primary"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Part Details */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CubeIcon className="w-5 h-5" />
              Part Details
            </h2>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Part Number</label>
                  <input
                    type="text"
                    value={formData.partNumber || ''}
                    onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer || ''}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Warehouse Location</label>
                  <input
                    type="text"
                    value={formData.warehouseLocation || ''}
                    onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Part Number</p>
                  <p className="font-medium">{part.partNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{part.category || 'Uncategorized'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Manufacturer</p>
                  <p className="font-medium">{part.manufacturer || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Warehouse Location</p>
                  <p className="font-medium">{part.warehouseLocation || '-'}</p>
                </div>
                {part.description && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{part.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Truck Stock */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TruckIcon className="w-5 h-5" />
              Truck Stock
            </h2>
            {part.truckStock && part.truckStock.length > 0 ? (
              <div className="space-y-2">
                {part.truckStock.map((stock) => (
                  <div
                    key={stock.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      stock.quantity <= stock.minQuantity ? 'bg-orange-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <TruckIcon className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{stock.truck.name}</p>
                        {stock.truck.vehicleId && (
                          <p className="text-sm text-gray-500">{stock.truck.vehicleId}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${stock.quantity <= stock.minQuantity ? 'text-orange-600' : ''}`}>
                        {stock.quantity}
                      </p>
                      <p className="text-xs text-gray-500">Min: {stock.minQuantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Not stocked on any trucks</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stock Levels */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Stock Levels</h2>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="label">Quantity On Hand</label>
                  <input
                    type="number"
                    value={formData.quantityOnHand || 0}
                    onChange={(e) => setFormData({ ...formData, quantityOnHand: parseInt(e.target.value) || 0 })}
                    className="input"
                    min="0"
                  />
                </div>
                <div>
                  <label className="label">Reorder Level</label>
                  <input
                    type="number"
                    value={formData.reorderLevel || 0}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
                    className="input"
                    min="0"
                  />
                </div>
                <div>
                  <label className="label">Reorder Quantity</label>
                  <input
                    type="number"
                    value={formData.reorderQty || 0}
                    onChange={(e) => setFormData({ ...formData, reorderQty: parseInt(e.target.value) || 0 })}
                    className="input"
                    min="0"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${isLowStock ? 'bg-orange-50' : 'bg-gray-50'}`}>
                  <p className="text-sm text-gray-500">Warehouse Stock</p>
                  <p className={`text-3xl font-bold ${isLowStock ? 'text-orange-600' : ''}`}>
                    {part.quantityOnHand}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">On Trucks</p>
                  <p className="text-3xl font-bold">{totalTruckStock}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Reorder Level</p>
                    <p className="font-medium">{part.reorderLevel}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reorder Qty</p>
                    <p className="font-medium">{part.reorderQty}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Pricing</h2>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="label">Cost</label>
                  <input
                    type="number"
                    value={formData.cost || 0}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    className="input"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="label">Price</label>
                  <input
                    type="number"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="input"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cost</span>
                  <span className="font-medium">{formatCurrency(part.cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Price</span>
                  <span className="font-medium">{formatCurrency(part.price)}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-500">Margin</span>
                  <span className="font-medium text-green-600">{margin}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Value */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Inventory Value</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Warehouse</span>
                <span className="font-medium">{formatCurrency(totalWarehouseValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trucks</span>
                <span className="font-medium">{formatCurrency(part.cost * totalTruckStock)}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-500">Total</span>
                <span className="font-bold">{formatCurrency(part.cost * (part.quantityOnHand + totalTruckStock))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
