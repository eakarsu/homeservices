'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  CubeIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

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
}

export default function PartsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPart, setEditingPart] = useState<Part | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [partToDelete, setPartToDelete] = useState<Part | null>(null)
  const [formData, setFormData] = useState({
    partNumber: '',
    name: '',
    description: '',
    category: '',
    manufacturer: '',
    cost: 0,
    price: 0,
    quantityOnHand: 0,
    reorderLevel: 5,
    reorderQty: 10,
    warehouseLocation: '',
  })

  const { data: parts, isLoading } = useQuery<Part[]>({
    queryKey: ['parts', search, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      const res = await fetch(`/api/parts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch parts')
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingPart ? `/api/parts/${editingPart.id}` : '/api/parts'
      const method = editingPart ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to save part')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      setShowModal(false)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/parts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete part')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      toast.success('Part deleted successfully')
      setDeleteModalOpen(false)
      setPartToDelete(null)
    },
    onError: () => {
      toast.error('Failed to delete part')
    }
  })

  const handleDeleteClick = (e: React.MouseEvent, part: Part) => {
    e.stopPropagation()
    setPartToDelete(part)
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (partToDelete) {
      deleteMutation.mutate(partToDelete.id)
    }
  }

  const resetForm = () => {
    setEditingPart(null)
    setFormData({
      partNumber: '',
      name: '',
      description: '',
      category: '',
      manufacturer: '',
      cost: 0,
      price: 0,
      quantityOnHand: 0,
      reorderLevel: 5,
      reorderQty: 10,
      warehouseLocation: '',
    })
  }

  const openEditModal = (part: Part) => {
    setEditingPart(part)
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
    setShowModal(true)
  }

  const categories = Array.from(new Set(parts?.map(p => p.category).filter(Boolean))) as string[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventory" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parts Catalog</h1>
            <p className="text-sm text-gray-500">{parts?.length || 0} parts</p>
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
          Add Part
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search parts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Parts List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : parts && parts.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {parts.map((part) => (
                <tr
                  key={part.id}
                  onClick={() => router.push(`/dashboard/inventory/parts/${part.id}`)}
                  className={`hover:bg-gray-50 cursor-pointer ${part.quantityOnHand <= part.reorderLevel ? 'bg-orange-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{part.name}</p>
                    <p className="text-sm text-gray-500">{part.partNumber}</p>
                    {part.manufacturer && (
                      <p className="text-xs text-gray-400">{part.manufacturer}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="badge bg-gray-100 text-gray-700">
                      {part.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${part.quantityOnHand <= part.reorderLevel ? 'text-orange-600' : 'text-gray-900'}`}>
                      {part.quantityOnHand}
                    </span>
                    {part.quantityOnHand <= part.reorderLevel && (
                      <p className="text-xs text-orange-500">Low stock</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    {formatCurrency(part.cost)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(part.price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(part)
                        }}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit part"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, part)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete part"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-12">
          <CubeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No parts found</h3>
          <p className="text-gray-500 mb-4">Add parts to your inventory</p>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Part
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {editingPart ? 'Edit Part' : 'Add Part'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Part Number *</label>
                <input
                  type="text"
                  value={formData.partNumber}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                  placeholder="e.g., Capacitors, Filters"
                />
              </div>
              <div>
                <label className="label">Manufacturer</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Cost *</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  className="input"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="label">Price *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="input"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="label">Quantity On Hand</label>
                <input
                  type="number"
                  value={formData.quantityOnHand}
                  onChange={(e) => setFormData({ ...formData, quantityOnHand: parseInt(e.target.value) || 0 })}
                  className="input"
                  min="0"
                />
              </div>
              <div>
                <label className="label">Reorder Level</label>
                <input
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
                  className="input"
                  min="0"
                />
              </div>
              <div>
                <label className="label">Reorder Quantity</label>
                <input
                  type="number"
                  value={formData.reorderQty}
                  onChange={(e) => setFormData({ ...formData, reorderQty: parseInt(e.target.value) || 0 })}
                  className="input"
                  min="0"
                />
              </div>
              <div>
                <label className="label">Warehouse Location</label>
                <input
                  type="text"
                  value={formData.warehouseLocation}
                  onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                  className="input"
                  placeholder="e.g., A1-B2"
                />
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
                disabled={!formData.partNumber || !formData.name || saveMutation.isPending}
                className="btn-primary"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Part'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && partToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Part</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-medium">{partToDelete.name}</span> ({partToDelete.partNumber})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setPartToDelete(null)
                }}
                className="btn-secondary"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn-primary bg-red-600 hover:bg-red-700"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
