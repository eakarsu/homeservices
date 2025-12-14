'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  UserIcon,
  PhoneIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { getStatusColor, getTradeColor } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Technician {
  id: string
  employeeId?: string
  color?: string
  tradeTypes: string[]
  certifications: string[]
  status: string
  payType: string
  hourlyRate?: number
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    avatar?: string
  }
  truck?: {
    id: string
    name: string
  }
  _count?: {
    assignments: number
  }
}

export default function TechniciansPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [techToDelete, setTechToDelete] = useState<Technician | null>(null)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/technicians/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete technician')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] })
      toast.success('Technician deleted successfully')
      setDeleteModalOpen(false)
      setTechToDelete(null)
    },
    onError: () => {
      toast.error('Failed to delete technician')
    }
  })

  const handleDeleteClick = (e: React.MouseEvent, tech: Technician) => {
    e.preventDefault()
    e.stopPropagation()
    setTechToDelete(tech)
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (techToDelete) {
      deleteMutation.mutate(techToDelete.id)
    }
  }

  const { data: technicians, isLoading } = useQuery<Technician[]>({
    queryKey: ['technicians'],
    queryFn: async () => {
      const res = await fetch('/api/technicians')
      if (!res.ok) throw new Error('Failed to fetch technicians')
      return res.json()
    },
  })

  const stats = {
    total: technicians?.length || 0,
    available: technicians?.filter(t => t.status === 'AVAILABLE').length || 0,
    onJob: technicians?.filter(t => t.status === 'ON_JOB').length || 0,
    offDuty: technicians?.filter(t => t.status === 'OFF_DUTY').length || 0,
  }

  // Filter technicians based on selected status
  const filteredTechnicians = statusFilter
    ? technicians?.filter(t => t.status === statusFilter)
    : technicians

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
          <p className="text-sm text-gray-500">Manage your field service team</p>
        </div>
        <Link href="/dashboard/technicians/new" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Add Technician
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter(null)}
          className={`card cursor-pointer transition-all hover:shadow-lg ${statusFilter === null ? 'ring-2 ring-primary-500' : ''}`}
        >
          <p className="text-sm text-gray-500">Total Technicians</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div
          onClick={() => setStatusFilter(statusFilter === 'AVAILABLE' ? null : 'AVAILABLE')}
          className={`card cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'AVAILABLE' ? 'ring-2 ring-green-500' : ''}`}
        >
          <p className="text-sm text-gray-500">Available</p>
          <p className="text-2xl font-bold text-green-600">{stats.available}</p>
        </div>
        <div
          onClick={() => setStatusFilter(statusFilter === 'ON_JOB' ? null : 'ON_JOB')}
          className={`card cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'ON_JOB' ? 'ring-2 ring-blue-500' : ''}`}
        >
          <p className="text-sm text-gray-500">On Job</p>
          <p className="text-2xl font-bold text-blue-600">{stats.onJob}</p>
        </div>
        <div
          onClick={() => setStatusFilter(statusFilter === 'OFF_DUTY' ? null : 'OFF_DUTY')}
          className={`card cursor-pointer transition-all hover:shadow-lg ${statusFilter === 'OFF_DUTY' ? 'ring-2 ring-gray-400' : ''}`}
        >
          <p className="text-sm text-gray-500">Off Duty</p>
          <p className="text-2xl font-bold text-gray-500">{stats.offDuty}</p>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {statusFilter && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filtering by:</span>
          <span className="badge bg-primary-100 text-primary-700">{statusFilter.replace('_', ' ')}</span>
          <button
            onClick={() => setStatusFilter(null)}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Technicians Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : filteredTechnicians && filteredTechnicians.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTechnicians.map((tech) => (
            <div key={tech.id} className="card hover:shadow-lg transition-shadow relative">
              <button
                onClick={(e) => handleDeleteClick(e, tech)}
                className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors z-10"
                title="Delete technician"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
              <Link href={`/dashboard/technicians/${tech.id}`} className="block">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
                  style={{ backgroundColor: tech.color || '#3B82F6' }}
                >
                  {tech.user.firstName[0]}{tech.user.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between pr-8">
                    <h3 className="font-semibold text-gray-900">
                      {tech.user.firstName} {tech.user.lastName}
                    </h3>
                    <span className={`badge ${getStatusColor(tech.status)}`}>
                      {tech.status.replace('_', ' ')}
                    </span>
                  </div>
                  {tech.employeeId && (
                    <p className="text-sm text-gray-500">#{tech.employeeId}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {/* Trades */}
                <div className="flex items-center gap-2">
                  <WrenchScrewdriverIcon className="w-4 h-4 text-gray-400" />
                  <div className="flex gap-1 flex-wrap">
                    {tech.tradeTypes.map((trade) => (
                      <span key={trade} className={`badge text-xs ${getTradeColor(trade)}`}>
                        {trade}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Truck */}
                {tech.truck && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TruckIcon className="w-4 h-4 text-gray-400" />
                    {tech.truck.name}
                  </div>
                )}

                {/* Contact */}
                {tech.user.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                    {tech.user.phone}
                  </div>
                )}
              </div>

              {/* Certifications */}
              {tech.certifications.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">Certifications</p>
                  <div className="flex gap-1 flex-wrap">
                    {tech.certifications.slice(0, 3).map((cert) => (
                      <span key={cert} className="badge bg-gray-100 text-gray-700 text-xs">
                        {cert}
                      </span>
                    ))}
                    {tech.certifications.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{tech.certifications.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No technicians found</h3>
          <p className="text-gray-500">Technicians are created when users with the TECHNICIAN role are added</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && techToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Technician</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-medium">{techToDelete.user.firstName} {techToDelete.user.lastName}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setTechToDelete(null)
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
