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
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { formatCurrency, formatPhone, getStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/ConfirmDialog'
import SortableHeader from '@/components/SortableHeader'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { exportToCSV } from '@/lib/csvExport'
import { exportTableToPDF } from '@/lib/pdfExport'

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
  const [sortField, setSortField] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState('')

  const { selectedIds, selectedCount, toggleItem, toggleAll, clearSelection, isSelected } = useBulkSelection()

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1)
  }

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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/customers/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) throw new Error('Failed to delete customers')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(`${data.deleted} customers deleted`)
      clearSelection()
      setBulkDeleteOpen(false)
    },
    onError: () => toast.error('Failed to delete customers')
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const res = await fetch('/api/customers/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status }),
      })
      if (!res.ok) throw new Error('Failed to update customers')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(`${data.updated} customers updated`)
      clearSelection()
      setBulkStatusOpen(false)
    },
    onError: () => toast.error('Failed to update customers')
  })

  const handleDeleteClick = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation()
    setCustomerToDelete(customer)
    setDeleteModalOpen(true)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, statusFilter, typeFilter, page, sortField, sortDirection],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
        sort: `${sortField}:${sortDirection}`,
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

  const handleExportCSV = async () => {
    const params = new URLSearchParams({ pageSize: '10000' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (typeFilter) params.set('type', typeFilter)
    const res = await fetch(`/api/customers?${params}`)
    const json = await res.json()
    exportToCSV(json.data || [], 'customers', [
      { key: 'customerNumber', label: 'Customer #' },
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'companyName', label: 'Company' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'totalSpent', label: 'Total Spent', format: (v) => String(v ?? 0) },
    ])
  }

  const handleExportPDF = async () => {
    const params = new URLSearchParams({ pageSize: '10000' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (typeFilter) params.set('type', typeFilter)
    const res = await fetch(`/api/customers?${params}`)
    const json = await res.json()
    const rows = (json.data || []).map((c: Customer) => ({
      customerNumber: c.customerNumber,
      name: getDisplayName(c),
      email: c.email || '',
      phone: c.phone || '',
      type: c.type,
      status: c.status,
      totalSpent: formatCurrency(c.totalSpent),
    }))
    exportTableToPDF('Customers', [
      { header: 'Customer #', dataKey: 'customerNumber' },
      { header: 'Name', dataKey: 'name' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Phone', dataKey: 'phone' },
      { header: 'Type', dataKey: 'type' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Total Spent', dataKey: 'totalSpent' },
    ], rows, 'customers')
  }

  const allIds = data?.data?.map((c: Customer) => c.id) || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-1 text-sm">
            <ArrowDownTrayIcon className="w-4 h-4" /> CSV
          </button>
          <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-1 text-sm">
            <ArrowDownTrayIcon className="w-4 h-4" /> PDF
          </button>
          <Link href="/dashboard/customers/new" className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            New Customer
          </Link>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-primary-700">{selectedCount} selected</span>
          <div className="flex items-center gap-2">
            <select
              className="select text-sm"
              value={bulkStatus}
              onChange={(e) => {
                setBulkStatus(e.target.value)
                if (e.target.value) setBulkStatusOpen(true)
              }}
            >
              <option value="">Change Status...</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="VIP">VIP</option>
              <option value="DO_NOT_SERVICE">Do Not Service</option>
            </select>
            <button
              onClick={() => setBulkDeleteOpen(true)}
              className="btn-primary bg-red-600 hover:bg-red-700 text-sm"
            >
              Delete Selected
            </button>
            <button onClick={clearSelection} className="btn-secondary text-sm">
              Clear
            </button>
          </div>
        </div>
      )}

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
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select className="select w-full md:w-40" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="VIP">VIP</option>
            <option value="DO_NOT_SERVICE">Do Not Service</option>
          </select>
          <select className="select w-full md:w-40" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}>
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
                  <th className="table-header w-10">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={allIds.length > 0 && allIds.every((id: string) => isSelected(id))}
                      onChange={() => toggleAll(allIds)}
                    />
                  </th>
                  <SortableHeader label="Customer" field="lastName" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  <th className="table-header">Contact</th>
                  <SortableHeader label="Type" field="type" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                  <SortableHeader label="Status" field="status" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
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
                    <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={isSelected(customer.id)}
                        onChange={() => toggleItem(customer.id)}
                      />
                    </td>
                    <td className="table-cell">
                      <p className="font-medium text-gray-900">{getDisplayName(customer)}</p>
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
                      <span className="badge badge-gray">{customer.type.replace('_', ' ')}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusColor(customer.status)}`}>{customer.status.replace('_', ' ')}</span>
                    </td>
                    <td className="table-cell text-right">{customer.propertyCount}</td>
                    <td className="table-cell text-right">{customer.jobCount}</td>
                    <td className="table-cell text-right font-medium">{formatCurrency(customer.totalSpent)}</td>
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
                <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
                <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages}>Next</button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">No customers found</div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteModalOpen && !!customerToDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customerToDelete ? getDisplayName(customerToDelete) : ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => customerToDelete && deleteMutation.mutate(customerToDelete.id)}
        onCancel={() => { setDeleteModalOpen(false); setCustomerToDelete(null) }}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        title="Delete Selected Customers"
        message={`Are you sure you want to delete ${selectedCount} customers? This action cannot be undone.`}
        confirmLabel="Delete All"
        variant="danger"
        isLoading={bulkDeleteMutation.isPending}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
        onCancel={() => setBulkDeleteOpen(false)}
      />

      {/* Bulk Status Update Confirmation */}
      <ConfirmDialog
        isOpen={bulkStatusOpen}
        title="Update Status"
        message={`Change status of ${selectedCount} customers to ${bulkStatus.replace('_', ' ')}?`}
        confirmLabel="Update"
        variant="info"
        isLoading={bulkUpdateMutation.isPending}
        onConfirm={() => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status: bulkStatus })}
        onCancel={() => { setBulkStatusOpen(false); setBulkStatus('') }}
      />
    </div>
  )
}
