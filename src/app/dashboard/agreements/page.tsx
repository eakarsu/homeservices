'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentCheckIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Agreement {
  id: string
  agreementNumber: string
  status: string
  startDate: string
  endDate: string
  renewalDate?: string
  billingFrequency: string
  visitsUsed: number
  lastVisitDate?: string
  nextVisitDue?: string
  customer: {
    id: string
    firstName?: string
    lastName?: string
    companyName?: string
  }
  plan: {
    id: string
    name: string
    monthlyPrice: number
    annualPrice: number
    visitsIncluded: number
  }
}

export default function AgreementsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [agreementToDelete, setAgreementToDelete] = useState<Agreement | null>(null)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/agreements/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete agreement')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] })
      toast.success('Agreement deleted successfully')
      setDeleteModalOpen(false)
      setAgreementToDelete(null)
    },
    onError: () => {
      toast.error('Failed to delete agreement')
    }
  })

  const handleDeleteClick = (e: React.MouseEvent, agreement: Agreement) => {
    e.stopPropagation()
    setAgreementToDelete(agreement)
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (agreementToDelete) {
      deleteMutation.mutate(agreementToDelete.id)
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['agreements', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/agreements?${params}`)
      if (!res.ok) throw new Error('Failed to fetch agreements')
      return res.json()
    },
  })

  const agreements: Agreement[] = data?.agreements || []

  const getCustomerName = (agreement: Agreement) => {
    const personalName = `${agreement.customer?.firstName || ''} ${agreement.customer?.lastName || ''}`.trim()
    if (personalName && agreement.customer?.companyName) {
      return `${personalName} (${agreement.customer.companyName})`
    }
    return personalName || agreement.customer?.companyName || 'Unknown'
  }

  const isExpiringSoon = (agreement: Agreement) => {
    if (agreement.status !== 'ACTIVE') return false
    const endDate = new Date(agreement.endDate)
    const daysUntilExpiry = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isVisitDue = (agreement: Agreement) => {
    if (!agreement.nextVisitDue) return false
    return new Date(agreement.nextVisitDue) <= new Date()
  }

  const stats = {
    active: agreements.filter(a => a.status === 'ACTIVE').length,
    expiringSoon: agreements.filter(a => isExpiringSoon(a)).length,
    visitsDue: agreements.filter(a => isVisitDue(a)).length,
    totalMRR: agreements
      .filter(a => a.status === 'ACTIVE')
      .reduce((sum, a) => sum + a.plan.monthlyPrice, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Agreements</h1>
          <p className="text-sm text-gray-500">Manage maintenance contracts and memberships</p>
        </div>
        <Link href="/dashboard/agreements/new" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          New Agreement
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Active Agreements</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Expiring Soon</p>
          <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Visits Due</p>
          <p className="text-2xl font-bold text-blue-600">{stats.visitsDue}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Monthly Revenue</p>
          <p className="text-2xl font-bold text-primary-600">{formatCurrency(stats.totalMRR)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search agreements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-full sm:w-40"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Agreements List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : agreements.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agreement</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Expires</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Visits</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {agreements.map((agreement) => (
                <tr
                  key={agreement.id}
                  onClick={() => router.push(`/dashboard/agreements/${agreement.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <p className="text-primary-600 font-medium">
                      {agreement.agreementNumber}
                    </p>
                    <p className="text-xs text-gray-500">Since {formatDate(agreement.startDate)}</p>
                  </td>
                  <td className="px-4 py-3">
                    {getCustomerName(agreement)}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="badge bg-purple-100 text-purple-700">{agreement.plan.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getStatusColor(agreement.status)}`}>
                      {agreement.status}
                    </span>
                    {isExpiringSoon(agreement) && (
                      <span className="badge bg-orange-100 text-orange-700 ml-1">Expiring</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={isExpiringSoon(agreement) ? 'text-orange-600 font-medium' : ''}>
                      {formatDate(agreement.endDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className={agreement.visitsUsed >= agreement.plan.visitsIncluded ? 'text-red-600' : ''}>
                      {agreement.visitsUsed} / {agreement.plan.visitsIncluded}
                    </span>
                    {isVisitDue(agreement) && (
                      <p className="text-xs text-orange-600">Visit due</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(agreement.billingFrequency === 'monthly'
                      ? agreement.plan.monthlyPrice
                      : agreement.plan.annualPrice
                    )}
                    <p className="text-xs text-gray-500">/{agreement.billingFrequency === 'monthly' ? 'mo' : 'yr'}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => handleDeleteClick(e, agreement)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete agreement"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-12">
          <DocumentCheckIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No agreements found</h3>
          <p className="text-gray-500 mb-4">Create service agreements for recurring revenue</p>
          <Link href="/dashboard/agreements/new" className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            New Agreement
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && agreementToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Agreement</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete agreement <span className="font-medium">{agreementToDelete.agreementNumber}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setAgreementToDelete(null)
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
