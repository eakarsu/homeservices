'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { formatCurrency, formatPhone, getStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Customer {
  id: string
  customerNumber: string
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
  type: string
  status: string
  propertyCount: number
  jobCount: number
  totalSpent: number
}

export default function CustomersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete customer')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer deleted successfully')
      setDeleteModalOpen(false)
      setCustomerToDelete(null)
    },
    onError: () => {
      toast.error('Failed to delete customer')
    }
  })

  const handleDeleteClick = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation()
    setCustomerToDelete(customer)
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id)
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, statusFilter, typeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
      })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (typeFilter) params.set('type', typeFilter)

      const res = await fetch(`/api/customers?${params}`)
      if (!res.ok) throw new Error('Failed to fetch customers')
      return res.json()
    },
  })

  const getDisplayName = (customer: Customer) => {
    const personalName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
    if (personalName && customer.companyName) {
      return `${personalName} (${customer.companyName})`
    }
    return personalName || customer.companyName || 'Unknown'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <Link href="/dashboard/customers/new" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          New Customer
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              className="input pl-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <select
            className="select w-full md:w-40"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="VIP">VIP</option>
            <option value="DO_NOT_SERVICE">Do Not Service</option>
          </select>
          <select
            className="select w-full md:w-40"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Types</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="PROPERTY_MANAGEMENT">Property Management</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : data?.data?.length ? (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Contact</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Properties</th>
                  <th className="table-header text-right">Jobs</th>
                  <th className="table-header text-right">Total Spent</th>
                  <th className="table-header text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.data.map((customer: Customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="table-cell">
                      <p className="font-medium text-gray-900">
                        {getDisplayName(customer)}
                      </p>
                      <p className="text-sm text-gray-500">{customer.customerNumber}</p>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <PhoneIcon className="w-4 h-4" />
                            {formatPhone(customer.phone)}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <EnvelopeIcon className="w-4 h-4" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-gray">
                        {customer.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusColor(customer.status)}`}>
                        {customer.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-cell text-right">{customer.propertyCount}</td>
                    <td className="table-cell text-right">{customer.jobCount}</td>
                    <td className="table-cell text-right font-medium">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="table-cell text-center">
                      <button
                        onClick={(e) => handleDeleteClick(e, customer)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete customer"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.total)} of {data.total} customers
              </p>
              <div className="flex gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= data.totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No customers found
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && customerToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Customer</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-medium">{getDisplayName(customerToDelete)}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setCustomerToDelete(null)
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
