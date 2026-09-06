'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  CreditCardIcon,
  LinkIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { getStatusColor, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/ConfirmDialog'
import SortableHeader from '@/components/SortableHeader'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { exportToCSV } from '@/lib/csvExport'
import { exportTableToPDF } from '@/lib/pdfExport'

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  balanceDue: number
  dueDate?: string
  paidDate?: string
  createdAt: string
  customer: { firstName?: string; lastName?: string; companyName?: string }
  job?: { jobNumber: string; title: string }
}

export default function InvoicesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState('')

  const { selectedIds, selectedCount, toggleItem, toggleAll, clearSelection, isSelected } = useBulkSelection()

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDirection('asc') }
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error(); return res.json() },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Invoice deleted'); setDeleteModalOpen(false); setInvoiceToDelete(null) },
    onError: () => toast.error('Failed to delete invoice')
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => { const res = await fetch('/api/invoices/bulk', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }); if (!res.ok) throw new Error(); return res.json() },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success(`${data.deleted} invoices deleted`); clearSelection(); setBulkDeleteOpen(false) },
    onError: () => toast.error('Failed to delete invoices')
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => { const res = await fetch('/api/invoices/bulk', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, status }) }); if (!res.ok) throw new Error(); return res.json() },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success(`${data.updated} invoices updated`); clearSelection(); setBulkStatusOpen(false) },
    onError: () => toast.error('Failed to update invoices')
  })

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', search, statusFilter, sortField, sortDirection],
    queryFn: async () => {
      const params = new URLSearchParams({ sort: `${sortField}:${sortDirection}` })
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/invoices?${params}`)
      if (!res.ok) throw new Error()
      return res.json()
    },
  })

  const invoices: Invoice[] = data?.invoices || []

  const getCustomerName = (invoice: Invoice) => {
    const personalName = `${invoice.customer?.firstName || ''} ${invoice.customer?.lastName || ''}`.trim()
    if (personalName && invoice.customer?.companyName) return `${personalName} (${invoice.customer.companyName})`
    return personalName || invoice.customer?.companyName || 'Unknown'
  }

  const isOverdue = (invoice: Invoice) => {
    if (!invoice.dueDate || invoice.status === 'PAID') return false
    return new Date(invoice.dueDate) < new Date()
  }

  const copyPaymentLink = (e: React.MouseEvent, invoiceId: string) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/pay/${invoiceId}`); toast.success('Payment link copied!') }
  const openPaymentPage = (e: React.MouseEvent, invoiceId: string) => { e.stopPropagation(); window.open(`/pay/${invoiceId}`, '_blank') }

  const stats = {
    total: invoices.length,
    outstanding: invoices.filter(i => ['ISSUED', 'SENT', 'VIEWED', 'PARTIAL', 'OVERDUE'].includes(i.status)).length,
    overdue: invoices.filter(i => isOverdue(i)).length,
    paid: invoices.filter(i => i.status === 'PAID').length,
    totalOutstanding: invoices.filter(i => ['ISSUED', 'SENT', 'VIEWED', 'PARTIAL', 'OVERDUE'].includes(i.status)).reduce((sum, i) => sum + Number(i.balanceDue), 0),
    totalPaid: invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + Number(i.paidAmount), 0),
  }

  const handleExportCSV = () => {
    exportToCSV(invoices, 'invoices', [
      { key: 'invoiceNumber', label: 'Invoice #' }, { key: 'status', label: 'Status' },
      { key: 'totalAmount', label: 'Amount', format: (v) => formatCurrency(v as number) },
      { key: 'balanceDue', label: 'Balance', format: (v) => formatCurrency(v as number) },
      { key: 'dueDate', label: 'Due Date', format: (v) => v ? new Date(v as string).toLocaleDateString() : '' },
    ])
  }

  const handleExportPDF = () => {
    const rows = invoices.map(i => ({
      invoiceNumber: i.invoiceNumber, customer: getCustomerName(i), status: i.status,
      amount: formatCurrency(i.totalAmount), balance: formatCurrency(i.balanceDue),
      dueDate: i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '',
    }))
    exportTableToPDF('Invoices', [
      { header: 'Invoice #', dataKey: 'invoiceNumber' }, { header: 'Customer', dataKey: 'customer' }, { header: 'Status', dataKey: 'status' },
      { header: 'Amount', dataKey: 'amount' }, { header: 'Balance', dataKey: 'balance' }, { header: 'Due Date', dataKey: 'dueDate' },
    ], rows, 'invoices')
  }

  const allIds = invoices.map(i => i.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Invoices</h1><p className="text-sm text-gray-500">Manage billing and payments</p></div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-1 text-sm"><ArrowDownTrayIcon className="w-4 h-4" /> CSV</button>
          <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-1 text-sm"><ArrowDownTrayIcon className="w-4 h-4" /> PDF</button>
          <Link href="/dashboard/invoices/new" className="btn-primary flex items-center gap-2"><PlusIcon className="w-5 h-5" />New Invoice</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-gray-500">Outstanding</p><p className="text-2xl font-bold text-blue-600">{stats.outstanding}</p><p className="text-sm text-gray-600">{formatCurrency(stats.totalOutstanding)}</p></div>
        <div className="card"><p className="text-sm text-gray-500">Overdue</p><p className="text-2xl font-bold text-red-600">{stats.overdue}</p>{stats.overdue > 0 && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><ExclamationTriangleIcon className="w-3 h-3" />Needs attention</p>}</div>
        <div className="card"><p className="text-sm text-gray-500">Settled (displayed invoices)</p><p className="text-2xl font-bold text-green-600">{stats.paid}</p><p className="text-sm text-gray-600">{formatCurrency(stats.totalPaid)}</p></div>
        <div className="card"><p className="text-sm text-gray-500">Total Invoices</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
      </div>

      {selectedCount > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-primary-700">{selectedCount} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={clearSelection} className="btn-secondary text-sm">Clear</button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1"><MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" /></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-full sm:w-40">
          <option value="all">All Status</option><option value="DRAFT">Draft</option><option value="ISSUED">Issued</option><option value="SENT">Sent</option><option value="VIEWED">Viewed</option><option value="PARTIAL">Partial</option><option value="PAID">Paid</option><option value="OVERDUE">Overdue</option><option value="VOID">Void</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div></div>
      ) : invoices.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded border-gray-300" checked={allIds.length > 0 && allIds.every(id => isSelected(id))} onChange={() => toggleAll(allIds)} /></th>
                <SortableHeader label="Invoice" field="invoiceNumber" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Job</th>
                <SortableHeader label="Status" field="status" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                <SortableHeader label="Due Date" field="dueDate" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell" />
                <SortableHeader label="Amount" field="totalAmount" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase" />
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)} className={`hover:bg-gray-50 cursor-pointer ${isOverdue(invoice) ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded border-gray-300" checked={isSelected(invoice.id)} onChange={() => toggleItem(invoice.id)} /></td>
                  <td className="px-4 py-3"><p className="text-primary-600 font-medium">{invoice.invoiceNumber}</p><p className="text-xs text-gray-500">{new Date(invoice.createdAt).toLocaleDateString()}</p></td>
                  <td className="px-4 py-3"><p className="font-medium text-gray-900">{getCustomerName(invoice)}</p></td>
                  <td className="px-4 py-3 hidden md:table-cell">{invoice.job ? <span className="text-sm">{invoice.job.jobNumber}</span> : <span className="text-gray-400">-</span>}</td>
                  <td className="px-4 py-3"><span className={`badge ${getStatusColor(invoice.status)}`}>{invoice.status}</span>{isOverdue(invoice) && invoice.status !== 'PAID' && <span className="badge bg-red-100 text-red-700 ml-1">OVERDUE</span>}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">{invoice.dueDate ? <span className={isOverdue(invoice) ? 'text-red-600 font-medium' : 'text-gray-600'}>{new Date(invoice.dueDate).toLocaleDateString()}</span> : <span className="text-gray-400">-</span>}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(invoice.totalAmount)}</td>
                  <td className="px-4 py-3 text-right"><span className={invoice.balanceDue > 0 ? 'font-bold text-red-600' : 'text-green-600'}>{formatCurrency(invoice.balanceDue)}</span></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {invoice.balanceDue > 0 && (<><button onClick={(e) => copyPaymentLink(e, invoice.id)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Copy payment link"><LinkIcon className="w-5 h-5" /></button><button onClick={(e) => openPaymentPage(e, invoice.id)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Open payment page"><CreditCardIcon className="w-5 h-5" /></button></>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-12"><CurrencyDollarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3><p className="text-gray-500 mb-4">Get started by creating your first invoice</p><Link href="/dashboard/invoices/new" className="btn-primary inline-flex items-center gap-2"><PlusIcon className="w-5 h-5" />New Invoice</Link></div>
      )}

      <ConfirmDialog isOpen={deleteModalOpen && !!invoiceToDelete} title="Delete Invoice" message={`Delete invoice ${invoiceToDelete?.invoiceNumber}? This cannot be undone.`} confirmLabel="Delete" variant="danger" isLoading={deleteMutation.isPending} onConfirm={() => invoiceToDelete && deleteMutation.mutate(invoiceToDelete.id)} onCancel={() => { setDeleteModalOpen(false); setInvoiceToDelete(null) }} />
      <ConfirmDialog isOpen={bulkDeleteOpen} title="Delete Selected Invoices" message={`Delete ${selectedCount} invoices? This cannot be undone.`} confirmLabel="Delete All" variant="danger" isLoading={bulkDeleteMutation.isPending} onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedIds))} onCancel={() => setBulkDeleteOpen(false)} />
      <ConfirmDialog isOpen={bulkStatusOpen} title="Update Status" message={`Change status of ${selectedCount} invoices to ${bulkStatus}?`} confirmLabel="Update" variant="info" isLoading={bulkUpdateMutation.isPending} onConfirm={() => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status: bulkStatus })} onCancel={() => { setBulkStatusOpen(false); setBulkStatus('') }} />
    </div>
  )
}
