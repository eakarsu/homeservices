'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { getStatusColor, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/ConfirmDialog'
import SortableHeader from '@/components/SortableHeader'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { exportToCSV } from '@/lib/csvExport'
import { exportTableToPDF } from '@/lib/pdfExport'

interface Estimate {
  id: string
  estimateNumber: string
  status: string
  goodTotal: number
  betterTotal: number
  bestTotal: number
  totalAmount: number
  validUntil?: string
  createdAt: string
  customer: { firstName?: string; lastName?: string; companyName?: string }
  job?: { jobNumber: string; title: string }
}

export default function EstimatesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [estimateToDelete, setEstimateToDelete] = useState<Estimate | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState('')

  const { selectedIds, selectedCount, toggleItem, toggleAll, clearSelection, isSelected } = useBulkSelection()

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDirection('asc') }
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const res = await fetch(`/api/estimates/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error(); return res.json() },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['estimates'] }); toast.success('Estimate deleted'); setDeleteModalOpen(false); setEstimateToDelete(null) },
    onError: () => toast.error('Failed to delete estimate')
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => { const res = await fetch('/api/estimates/bulk', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }); if (!res.ok) throw new Error(); return res.json() },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['estimates'] }); toast.success(`${data.deleted} estimates deleted`); clearSelection(); setBulkDeleteOpen(false) },
    onError: () => toast.error('Failed to delete estimates')
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => { const res = await fetch('/api/estimates/bulk', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, status }) }); if (!res.ok) throw new Error(); return res.json() },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['estimates'] }); toast.success(`${data.updated} estimates updated`); clearSelection(); setBulkStatusOpen(false) },
    onError: () => toast.error('Failed to update estimates')
  })

  const { data, isLoading } = useQuery({
    queryKey: ['estimates', search, statusFilter, sortField, sortDirection],
    queryFn: async () => {
      const params = new URLSearchParams({ sort: `${sortField}:${sortDirection}` })
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/estimates?${params}`)
      if (!res.ok) throw new Error('Failed to fetch estimates')
      return res.json()
    },
  })

  const estimates: Estimate[] = data?.estimates || []

  const getCustomerName = (estimate: Estimate) => {
    const personalName = `${estimate.customer?.firstName || ''} ${estimate.customer?.lastName || ''}`.trim()
    if (personalName && estimate.customer?.companyName) return `${personalName} (${estimate.customer.companyName})`
    return personalName || estimate.customer?.companyName || 'Unknown'
  }

  const stats = {
    total: estimates.length,
    draft: estimates.filter(e => e.status === 'DRAFT').length,
    sent: estimates.filter(e => e.status === 'SENT').length,
    approved: estimates.filter(e => e.status === 'APPROVED').length,
    totalValue: estimates.reduce((sum, e) => sum + (e.totalAmount || 0), 0),
  }

  const handleExportCSV = () => {
    exportToCSV(estimates, 'estimates', [
      { key: 'estimateNumber', label: 'Estimate #' },
      { key: 'status', label: 'Status' },
      { key: 'goodTotal', label: 'Good', format: (v) => formatCurrency(v as number) },
      { key: 'betterTotal', label: 'Better', format: (v) => formatCurrency(v as number) },
      { key: 'bestTotal', label: 'Best', format: (v) => formatCurrency(v as number) },
      { key: 'createdAt', label: 'Created', format: (v) => new Date(v as string).toLocaleDateString() },
    ])
  }

  const handleExportPDF = () => {
    const rows = estimates.map(e => ({
      estimateNumber: e.estimateNumber, customer: getCustomerName(e), status: e.status,
      good: formatCurrency(e.goodTotal), better: formatCurrency(e.betterTotal), best: formatCurrency(e.bestTotal),
    }))
    exportTableToPDF('Estimates', [
      { header: 'Estimate #', dataKey: 'estimateNumber' }, { header: 'Customer', dataKey: 'customer' }, { header: 'Status', dataKey: 'status' },
      { header: 'Good', dataKey: 'good' }, { header: 'Better', dataKey: 'better' }, { header: 'Best', dataKey: 'best' },
    ], rows, 'estimates')
  }

  const allIds = estimates.map(e => e.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Estimates</h1><p className="text-sm text-gray-500">Manage and track customer estimates</p></div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-1 text-sm"><ArrowDownTrayIcon className="w-4 h-4" /> CSV</button>
          <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-1 text-sm"><ArrowDownTrayIcon className="w-4 h-4" /> PDF</button>
          <Link href="/dashboard/estimates/new" className="btn-primary flex items-center gap-2"><PlusIcon className="w-5 h-5" />New Estimate</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card text-center"><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-xs text-gray-500">Total</p></div>
        <div className="card text-center"><p className="text-2xl font-bold text-gray-500">{stats.draft}</p><p className="text-xs text-gray-500">Draft</p></div>
        <div className="card text-center"><p className="text-2xl font-bold text-blue-600">{stats.sent}</p><p className="text-xs text-gray-500">Sent</p></div>
        <div className="card text-center"><p className="text-2xl font-bold text-green-600">{stats.approved}</p><p className="text-xs text-gray-500">Approved</p></div>
        <div className="card text-center"><p className="text-2xl font-bold text-primary-600">{formatCurrency(stats.totalValue)}</p><p className="text-xs text-gray-500">Total Value</p></div>
      </div>

      {selectedCount > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-primary-700">{selectedCount} selected</span>
          <div className="flex items-center gap-2">
            <select className="select text-sm" value={bulkStatus} onChange={(e) => { setBulkStatus(e.target.value); if (e.target.value) setBulkStatusOpen(true) }}>
              <option value="">Change Status...</option><option value="DRAFT">Draft</option><option value="SENT">Sent</option><option value="APPROVED">Approved</option><option value="DECLINED">Declined</option>
            </select>
            <button onClick={() => setBulkDeleteOpen(true)} className="btn-primary bg-red-600 hover:bg-red-700 text-sm">Delete Selected</button>
            <button onClick={clearSelection} className="btn-secondary text-sm">Clear</button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1"><MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search estimates..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" /></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-full sm:w-40">
          <option value="all">All Status</option><option value="DRAFT">Draft</option><option value="SENT">Sent</option><option value="VIEWED">Viewed</option><option value="APPROVED">Approved</option><option value="DECLINED">Declined</option><option value="EXPIRED">Expired</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div></div>
      ) : estimates.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded border-gray-300" checked={allIds.length > 0 && allIds.every(id => isSelected(id))} onChange={() => toggleAll(allIds)} /></th>
                <SortableHeader label="Estimate" field="estimateNumber" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Job</th>
                <SortableHeader label="Status" field="status" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Good</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Better</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Best</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {estimates.map((estimate) => (
                <tr key={estimate.id} onClick={() => router.push(`/dashboard/estimates/${estimate.id}`)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded border-gray-300" checked={isSelected(estimate.id)} onChange={() => toggleItem(estimate.id)} /></td>
                  <td className="px-4 py-3"><p className="text-primary-600 font-medium">{estimate.estimateNumber}</p><p className="text-xs text-gray-500">{new Date(estimate.createdAt).toLocaleDateString()}</p></td>
                  <td className="px-4 py-3"><p className="font-medium text-gray-900">{getCustomerName(estimate)}</p></td>
                  <td className="px-4 py-3 hidden md:table-cell">{estimate.job ? <span className="text-sm">{estimate.job.jobNumber}</span> : <span className="text-gray-400">-</span>}</td>
                  <td className="px-4 py-3"><span className={`badge ${getStatusColor(estimate.status)}`}>{estimate.status}</span></td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(estimate.goodTotal)}</td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">{formatCurrency(estimate.betterTotal)}</td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">{formatCurrency(estimate.bestTotal)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={(e) => { e.stopPropagation(); setEstimateToDelete(estimate); setDeleteModalOpen(true) }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete estimate"><TrashIcon className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-12"><DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900 mb-2">No estimates found</h3><p className="text-gray-500 mb-4">Get started by creating your first estimate</p><Link href="/dashboard/estimates/new" className="btn-primary inline-flex items-center gap-2"><PlusIcon className="w-5 h-5" />New Estimate</Link></div>
      )}

      <ConfirmDialog isOpen={deleteModalOpen && !!estimateToDelete} title="Delete Estimate" message={`Delete estimate ${estimateToDelete?.estimateNumber}? This cannot be undone.`} confirmLabel="Delete" variant="danger" isLoading={deleteMutation.isPending} onConfirm={() => estimateToDelete && deleteMutation.mutate(estimateToDelete.id)} onCancel={() => { setDeleteModalOpen(false); setEstimateToDelete(null) }} />
      <ConfirmDialog isOpen={bulkDeleteOpen} title="Delete Selected Estimates" message={`Delete ${selectedCount} estimates? This cannot be undone.`} confirmLabel="Delete All" variant="danger" isLoading={bulkDeleteMutation.isPending} onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedIds))} onCancel={() => setBulkDeleteOpen(false)} />
      <ConfirmDialog isOpen={bulkStatusOpen} title="Update Status" message={`Change status of ${selectedCount} estimates to ${bulkStatus}?`} confirmLabel="Update" variant="info" isLoading={bulkUpdateMutation.isPending} onConfirm={() => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status: bulkStatus })} onCancel={() => { setBulkStatusOpen(false); setBulkStatus('') }} />
    </div>
  )
}
