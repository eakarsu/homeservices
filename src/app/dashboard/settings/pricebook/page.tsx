'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'

interface PricebookItem {
  id: string
  code: string
  name: string
  description?: string
  category: string
  type: string
  unitCost?: number
  unitPrice: number
  laborMinutes?: number
  isActive: boolean
}

export default function PricebookPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<PricebookItem | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'Labor',
    type: 'Flat Rate',
    unitCost: 0,
    unitPrice: 0,
    laborMinutes: 0,
  })

  const { data: items, isLoading } = useQuery<PricebookItem[]>({
    queryKey: ['pricebook', search, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      const res = await fetch(`/api/pricebook?${params}`)
      if (!res.ok) throw new Error('Failed to fetch pricebook')
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingItem ? `/api/pricebook/${editingItem.id}` : '/api/pricebook'
      const method = editingItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to save item')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook'] })
      setShowModal(false)
      resetForm()
    },
  })

  const resetForm = () => {
    setEditingItem(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      category: 'Labor',
      type: 'Flat Rate',
      unitCost: 0,
      unitPrice: 0,
      laborMinutes: 0,
    })
  }

  const openEditModal = (item: PricebookItem) => {
    setEditingItem(item)
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      category: item.category,
      type: item.type,
      unitCost: item.unitCost || 0,
      unitPrice: item.unitPrice,
      laborMinutes: item.laborMinutes || 0,
    })
    setShowModal(true)
  }

  const categories = ['Labor', 'Parts', 'Equipment', 'Misc']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pricebook</h1>
            <p className="text-sm text-gray-500">{items?.length || 0} items</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search pricebook..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input w-full sm:w-40"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Items Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : items && items.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{item.code}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-500 truncate max-w-xs">{item.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="badge bg-gray-100 text-gray-700">{item.category}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-600">
                    {item.type}
                    {item.laborMinutes && ` (${item.laborMinutes} min)`}
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell text-sm text-gray-600">
                    {item.unitCost ? formatCurrency(item.unitCost) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No pricebook items found</p>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Item
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">
              {editingItem ? 'Edit Pricebook Item' : 'Add Pricebook Item'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input"
                    placeholder="e.g., LABOR-001"
                  />
                </div>
                <div>
                  <label className="label">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input"
                  >
                    <option value="Flat Rate">Flat Rate</option>
                    <option value="Per Hour">Per Hour</option>
                    <option value="Per Unit">Per Unit</option>
                  </select>
                </div>
                <div>
                  <label className="label">Labor Minutes</label>
                  <input
                    type="number"
                    value={formData.laborMinutes}
                    onChange={(e) => setFormData({ ...formData, laborMinutes: parseInt(e.target.value) || 0 })}
                    className="input"
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Cost</label>
                  <input
                    type="number"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                    className="input"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="label">Price *</label>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="input"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => saveMutation.mutate(formData)}
                disabled={!formData.code || !formData.name || saveMutation.isPending}
                className="btn-primary"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
