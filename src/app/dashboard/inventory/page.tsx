'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  CubeIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  ArrowTrendingDownIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'

interface Part {
  id: string
  partNumber: string
  name: string
  category?: string
  quantityOnHand: number
  reorderLevel: number
  cost: number
  price: number
}

interface Truck {
  id: string
  name: string
  vehicleId?: string
  technicians: Array<{
    user: { firstName: string; lastName: string }
  }>
  stock: Array<{
    quantity: number
    minQuantity: number
    part: { name: string }
  }>
}

export default function InventoryDashboardPage() {
  const { data: parts } = useQuery<Part[]>({
    queryKey: ['parts'],
    queryFn: async () => {
      const res = await fetch('/api/parts')
      if (!res.ok) throw new Error('Failed to fetch parts')
      return res.json()
    },
  })

  const { data: trucks } = useQuery<Truck[]>({
    queryKey: ['trucks-with-stock'],
    queryFn: async () => {
      const res = await fetch('/api/trucks?includeStock=true')
      if (!res.ok) throw new Error('Failed to fetch trucks')
      return res.json()
    },
  })

  const lowStockParts = parts?.filter(p => p.quantityOnHand <= p.reorderLevel) || []
  const totalInventoryValue = parts?.reduce((sum, p) => sum + (p.cost * p.quantityOnHand), 0) || 0
  const totalParts = parts?.reduce((sum, p) => sum + p.quantityOnHand, 0) || 0

  const getTruckLowStock = (truck: Truck) => {
    return (truck.stock || []).filter(s => s.quantity <= s.minQuantity)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">Manage parts and truck inventory</p>
        </div>
        <Link href="/dashboard/inventory/parts" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          Add Part
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/dashboard/inventory/parts" className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CubeIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{parts?.length || 0}</p>
              <p className="text-sm text-gray-500">Part Types</p>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/inventory/parts" className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CubeIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalParts}</p>
              <p className="text-sm text-gray-500">Total Units</p>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/inventory/trucks" className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TruckIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{trucks?.length || 0}</p>
              <p className="text-sm text-gray-500">Trucks</p>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/inventory/parts?filter=low" className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{lowStockParts.length}</p>
              <p className="text-sm text-gray-500">Low Stock</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <ArrowTrendingDownIcon className="w-5 h-5 text-orange-600" />
              Low Stock Alerts
            </h2>
            <Link href="/dashboard/inventory/parts?filter=low" className="text-primary-600 text-sm hover:underline">
              View All
            </Link>
          </div>
          {lowStockParts.length > 0 ? (
            <div className="space-y-2">
              {lowStockParts.slice(0, 5).map((part) => (
                <Link
                  key={part.id}
                  href={`/dashboard/inventory/parts/${part.id}`}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium">{part.name}</p>
                    <p className="text-sm text-gray-500">{part.partNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">{part.quantityOnHand}</p>
                    <p className="text-xs text-gray-500">Reorder at {part.reorderLevel}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">All stock levels are good</p>
          )}
        </div>

        {/* Truck Inventory Overview */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <TruckIcon className="w-5 h-5" />
              Truck Inventory
            </h2>
            <Link href="/dashboard/inventory/trucks" className="text-primary-600 text-sm hover:underline">
              Manage
            </Link>
          </div>
          {trucks && trucks.length > 0 ? (
            <div className="space-y-3">
              {trucks.map((truck) => {
                const lowStock = getTruckLowStock(truck)
                const techName = truck.technicians[0]
                  ? `${truck.technicians[0].user.firstName} ${truck.technicians[0].user.lastName}`
                  : 'Unassigned'
                return (
                  <Link
                    key={truck.id}
                    href={`/dashboard/inventory/trucks?truckId=${truck.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <TruckIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{truck.name}</p>
                        <p className="text-sm text-gray-500">{techName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{(truck.stock || []).length} items</p>
                      {lowStock.length > 0 && (
                        <p className="text-xs text-orange-600">
                          {lowStock.length} low stock
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No trucks configured</p>
          )}
        </div>
      </div>

      {/* Inventory Value */}
      <div className="card">
        <h2 className="font-semibold mb-4">Inventory Value</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500">Warehouse Value</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalInventoryValue)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500">Potential Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(parts?.reduce((sum, p) => sum + (p.price * p.quantityOnHand), 0) || 0)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500">Avg Markup</p>
            <p className="text-2xl font-bold text-primary-600">
              {parts && parts.length > 0
                ? `${Math.round((parts.reduce((sum, p) => sum + ((p.price - p.cost) / p.cost * 100), 0) / parts.length))}%`
                : '0%'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/inventory/parts" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <CubeIcon className="w-8 h-8 text-primary-600" />
            <div>
              <p className="font-semibold">Parts Catalog</p>
              <p className="text-sm text-gray-500">Manage all parts</p>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/inventory/trucks" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <TruckIcon className="w-8 h-8 text-primary-600" />
            <div>
              <p className="font-semibold">Truck Stock</p>
              <p className="text-sm text-gray-500">Truck inventory levels</p>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/inventory/parts?action=reorder" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <ArrowTrendingDownIcon className="w-8 h-8 text-orange-600" />
            <div>
              <p className="font-semibold">Reorder Report</p>
              <p className="text-sm text-gray-500">Items needing restock</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
