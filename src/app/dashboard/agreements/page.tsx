'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentCheckIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/ConfirmDialog'
import SortableHeader from '@/components/SortableHeader'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { exportToCSV } from '@/lib/csvExport'
import { exportTableToPDF } from '@/lib/pdfExport'

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
  customer: { id: string; firstName?: string; lastName?: string; companyName?: string }
  plan: { id: string; name: string; monthlyPrice: number; annualPrice: number; visitsIncluded: number }
}

export default function AgreementsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [agreementToDelete, setAgreementToDelete] = useState<Agreement | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState('')

  const { selectedIds, selectedCount, toggleItem, toggleAll, clearSelection, isSelected } = useBulkSelection()

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDirection('asc') }
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const res = await fetch(`/api/agreements/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error(); return res.json() },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['agreements'] }); toast.success('Agreement deleted'); setDeleteModalOpen(false); setAgreementToDelete(null) },
    onError: () => toast.error('Failed to delete agreement')
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => { const res = await fetch('/api/agreements/bulk', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }); if (!res.ok) throw new Error(); return res.json() },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['agreements'] }); toast.success(`${data.deleted} agreements deleted`); clearSelection(); setBulkDeleteOpen(false) },
    onError: () => toast.error('Failed to delete agreements')
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => { const res = await fetch('/api/agreements/bulk', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, status }) }); if (!res.ok) throw new Error(); return res.json() },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['agreements'] }); toast.success(`${data.updated} agreements updated`); clearSelection(); setBulkStatusOpen(false) },
    onError: () => toast.error('Failed to update agreements')
  })

  const { data, isLoading } = useQuery({
    queryKey: ['agreements', search, statusFilter, sortField, sortDirection],
    queryFn: async () => {
      const params = new URLSearchParams({ sort: `${sortField}:${sortDirection}` })
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/agreements?${params}`)
      if (!res.ok) throw new Error()
      return res.json()
    },
  })

  const agreements: Agreement[] = data?.agreements || []

  const getCustomerName = (agreement: Agreement) => {
    const personalName = `${agreement.customer?.firstName || ''} ${agreement.customer?.lastName || ''}`.trim()
    if (personalName && agreement.customer?.companyName) return `${personalName} (${agreement.customer.companyName})`
    return personalName || agreement.customer?.companyName || 'Unknown'
  }

  const isExpiringSoon = (a: Agreement) => {
    if (a.status !== 'ACTIVE') return false
    const daysUntilExpiry = Math.ceil((new Date(a.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isVisitDue = (a: Agreement) => a.nextVisitDue ? new Date(a.nextVisitDue) <= new Date() : false

  const stats = {
    active: agreements.filter(a => a.status === 'ACTIVE').length,
    expiringSoon: agreements.filter(a => isExpiringSoon(a)).length,
    visitsDue: agreements.filter(a => isVisitDue(a)).length,
    totalMRR: agreements.filter(a => a.status === 'ACTIVE').reduce((sum, a) => sum + a.plan.monthlyPrice, 0),
  }

  const handleExportCSV = () => {
    exportToCSV(agreements, 'agreements', [
      { key: 'agreementNumber', label: 'Agreement #' }, { key: 'status', label: 'Status' },
      { key: 'startDate', label: 'Start', format: (v) => new Date(v as string).toLocaleDateString() },
      { key: 'endDate', label: 'End', format: (v) => new Date(v as string).toLocaleDateString() },
      { key: 'billingFrequency', label: 'Billing' },
    ])
  }

  const handleExportPDF = () => {
    const rows = agreements.map(a => ({
      agreementNumber: a.agreementNumber, customer: getCustomerName(a), plan: a.plan.name, status: a.status,
      expires: formatDate(a.endDate), price: formatCurrency(a.billingFrequency === 'monthly' ? a.plan.monthlyPrice : a.plan.annualPrice),
    }))
    exportTableToPDF('Service Agreements', [
      { header: 'Agreement #', dataKey: 'agreementNumber' }, { header: 'Customer', dataKey: 'customer' }, { header: 'Plan', dataKey: 'plan' },
      { header: 'Status', dataKey: 'status' }, { header: 'Expires', dataKey: 'expires' }, { header: 'Price', dataKey: 'price' },
    ], rows, 'agreements')
  }

  const allIds = agreements.map(a => a.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Service Agreements</h1><p className="text-sm text-gray-500">Manage maintenance contracts and memberships</p></div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-1 text-sm"><ArrowDownTrayIcon className="w-4 h-4" /> CSV</button>
          <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-1 text-sm"><ArrowDownTrayIcon className="w-4 h-4" /> PDF</button>
          <Link href="/dashboard/agreements/new" className="btn-primary flex items-center gap-2"><PlusIcon className="w-5 h-5" />New Agreement</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-gray-500">Active Agreements</p><p className="text-2xl font-bold text-green-600">{stats.active}</p></div>
        <div className="card"><p className="text-sm text-gray-500">Expiring Soon</p><p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p></div>
        <div className="card"><p className="text-sm text-gray-500">Visits Due</p><p className="text-2xl font-bold text-blue-600">{stats.visitsDue}</p></div>
        <div className="card"><p className="text-sm text-gray-500">Monthly Revenue</p><p className="text-2xl font-bold text-primary-600">{formatCurrency(stats.totalMRR)}</p></div>
      </div>

      {selectedCount > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-primary-700">{selectedCount} selected</span>
          <div className="flex items-center gap-2">
            <select className="select text-sm" value={bulkStatus} onChange={(e) => { setBulkStatus(e.target.value); if (e.target.value) setBulkStatusOpen(true) }}>
              <option value="">Change Status...</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="CANCELLED">Cancelled</option>
            </select>
            <button onClick={() => setBulkDeleteOpen(true)} className="btn-primary bg-red-600 hover:bg-red-700 text-sm">Delete Selected</button>
            <button onClick={clearSelection} className="btn-secondary text-sm">Clear</button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1"><MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search agreements..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" /></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-full sm:w-40">
          <option value="all">All Status</option><option value="ACTIVE">Active</option><option value="PENDING">Pending</option><option value="EXPIRED">Expired</option><option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div></div>
      ) : agreements.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded border-gray-300" checked={allIds.length > 0 && allIds.every(id => isSelected(id))} onChange={() => toggleAll(allIds)} /></th>
                <SortableHeader label="Agreement" field="agreementNumber" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Plan</th>
                <SortableHeader label="Status" field="status" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                <SortableHeader label="Expires" field="endDate" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell" />
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Visits</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {agreements.map((agreement) => (
                <tr key={agreement.id} onClick={() => router.push(`/dashboard/agreements/${agreement.id}`)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded border-gray-300" checked={isSelected(agreement.id)} onChange={() => toggleItem(agreement.id)} /></td>
                  <td className="px-4 py-3"><p className="text-primary-600 font-medium">{agreement.agreementNumber}</p><p className="text-xs text-gray-500">Since {formatDate(agreement.startDate)}</p></td>
                  <td className="px-4 py-3">{getCustomerName(agreement)}</td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="badge bg-purple-100 text-purple-700">{agreement.plan.name}</span></td>
                  <td className="px-4 py-3"><span className={`badge ${getStatusColor(agreement.status)}`}>{agreement.status}</span>{isExpiringSoon(agreement) && <span className="badge bg-orange-100 text-orange-700 ml-1">Expiring</span>}</td>
                  <td className="px-4 py-3 hidden sm:table-cell"><span className={isExpiringSoon(agreement) ? 'text-orange-600 font-medium' : ''}>{formatDate(agreement.endDate)}</span></td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell"><span className={agreement.visitsUsed >= agreement.plan.visitsIncluded ? 'text-red-600' : ''}>{agreement.visitsUsed} / {agreement.plan.visitsIncluded}</span>{isVisitDue(agreement) && <p className="text-xs text-orange-600">Visit due</p>}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(agreement.billingFrequency === 'monthly' ? agreement.plan.monthlyPrice : agreement.plan.annualPrice)}<p className="text-xs text-gray-500">/{agreement.billingFrequency === 'monthly' ? 'mo' : 'yr'}</p></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={(e) => { e.stopPropagation(); setAgreementToDelete(agreement); setDeleteModalOpen(true) }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete agreement"><TrashIcon className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-12"><DocumentCheckIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900 mb-2">No agreements found</h3><p className="text-gray-500 mb-4">Create service agreements for recurring revenue</p><Link href="/dashboard/agreements/new" className="btn-primary inline-flex items-center gap-2"><PlusIcon className="w-5 h-5" />New Agreement</Link></div>
      )}

      <ConfirmDialog isOpen={deleteModalOpen && !!agreementToDelete} title="Delete Agreement" message={`Delete agreement ${agreementToDelete?.agreementNumber}? This cannot be undone.`} confirmLabel="Delete" variant="danger" isLoading={deleteMutation.isPending} onConfirm={() => agreementToDelete && deleteMutation.mutate(agreementToDelete.id)} onCancel={() => { setDeleteModalOpen(false); setAgreementToDelete(null) }} />
      <ConfirmDialog isOpen={bulkDeleteOpen} title="Delete Selected Agreements" message={`Delete ${selectedCount} agreements? This cannot be undone.`} confirmLabel="Delete All" variant="danger" isLoading={bulkDeleteMutation.isPending} onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedIds))} onCancel={() => setBulkDeleteOpen(false)} />
      <ConfirmDialog isOpen={bulkStatusOpen} title="Update Status" message={`Change status of ${selectedCount} agreements to ${bulkStatus}?`} confirmLabel="Update" variant="info" isLoading={bulkUpdateMutation.isPending} onConfirm={() => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status: bulkStatus })} onCancel={() => { setBulkStatusOpen(false); setBulkStatus('') }} />
    </div>
  )
}
