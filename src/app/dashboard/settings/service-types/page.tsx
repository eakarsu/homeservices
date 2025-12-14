'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { getTradeColor } from '@/lib/utils'

interface ServiceType {
  id: string
  name: string
  code?: string
  description?: string
  tradeType: string
  defaultDuration?: number
  color?: string
  isActive: boolean
}

export default function ServiceTypesPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ServiceType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    tradeType: 'HVAC',
    defaultDuration: 60,
    color: '#3B82F6',
  })

  const { data: serviceTypes, isLoading } = useQuery<ServiceType[]>({
    queryKey: ['service-types'],
    queryFn: async () => {
      const res = await fetch('/api/service-types')
      if (!res.ok) throw new Error('Failed to fetch service types')
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingItem ? `/api/service-types/${editingItem.id}` : '/api/service-types'
      const method = editingItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to save service type')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] })
      setShowModal(false)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/service-types/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] })
    },
  })

  const resetForm = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      code: '',
      description: '',
      tradeType: 'HVAC',
      defaultDuration: 60,
      color: '#3B82F6',
    })
  }

  const openEditModal = (item: ServiceType) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      code: item.code || '',
      description: item.description || '',
      tradeType: item.tradeType,
      defaultDuration: item.defaultDuration || 60,
      color: item.color || '#3B82F6',
    })
    setShowModal(true)
  }

  const groupedTypes = serviceTypes?.reduce((acc, st) => {
    const key = st.tradeType
    if (!acc[key]) acc[key] = []
    acc[key].push(st)
    return acc
  }, {} as Record<string, ServiceType[]>) || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Types</h1>
            <p className="text-sm text-gray-500">{serviceTypes?.length || 0} service types</p>
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
          Add Service Type
        </button>
      </div>

      {/* Service Types by Trade */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTypes).map(([trade, types]) => (
            <div key={trade} className="card">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <span className={`badge ${getTradeColor(trade)}`}>{trade}</span>
                <span className="text-gray-500 text-sm font-normal">({types.length} types)</span>
              </h2>
              <div className="space-y-2">
                {types.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: st.color || '#3B82F6' }}
                      />
                      <div>
                        <p className="font-medium">{st.name}</p>
                        {st.description && (
                          <p className="text-sm text-gray-500">{st.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {st.defaultDuration && (
                        <span className="text-sm text-gray-500">{st.defaultDuration} min</span>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(st)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this service type?')) {
                              deleteMutation.mutate(st.id)
                            }
                          }}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(groupedTypes).length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-4">No service types configured</p>
              <button
                onClick={() => {
                  resetForm()
                  setShowModal(true)
                }}
                className="btn-primary inline-flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Add Service Type
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              {editingItem ? 'Edit Service Type' : 'Add Service Type'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., AC Repair"
                />
              </div>
              <div>
                <label className="label">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input"
                  placeholder="e.g., HVAC-REP"
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
                  <label className="label">Trade Type *</label>
                  <select
                    value={formData.tradeType}
                    onChange={(e) => setFormData({ ...formData, tradeType: e.target.value })}
                    className="input"
                  >
                    <option value="HVAC">HVAC</option>
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>
                <div>
                  <label className="label">Default Duration (min)</label>
                  <input
                    type="number"
                    value={formData.defaultDuration}
                    onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || 60 })}
                    className="input"
                    min="15"
                    step="15"
                  />
                </div>
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="input flex-1"
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
                disabled={!formData.name || saveMutation.isPending}
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
