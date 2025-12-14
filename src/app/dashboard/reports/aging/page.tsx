'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, CurrencyDollarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'

interface AgingInvoice {
  id: string
  invoiceNumber: string
  customerName: string
  amount: number
  dueDate: string
  daysOverdue: number
  status: string
}

interface AgingSummary {
  current: number
  days1to30: number
  days31to60: number
  days61to90: number
  over90: number
  total: number
}

export default function AgingReportPage() {
  const router = useRouter()

  const { data, isLoading } = useQuery<{ invoices: AgingInvoice[]; summary: AgingSummary }>({
    queryKey: ['reports-aging'],
    queryFn: async () => {
      const res = await fetch('/api/reports/aging')
      if (!res.ok) throw new Error('Failed to fetch aging report')
      const result = await res.json()
      // Transform the API response to match the expected format
      const buckets = result.buckets || {}
      const invoices: AgingInvoice[] = []

      // Collect all invoices from buckets
      Object.entries(buckets).forEach(([key, bucket]: [string, any]) => {
        if (bucket.invoices) {
          bucket.invoices.forEach((inv: any) => {
            invoices.push({
              id: inv.id,
              invoiceNumber: inv.number,
              customerName: inv.customer,
              amount: inv.amount,
              dueDate: new Date(Date.now() - inv.daysOld * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              daysOverdue: inv.daysOld,
              status: 'OVERDUE'
            })
          })
        }
      })

      return {
        invoices,
        summary: {
          current: buckets.current?.amount || 0,
          days1to30: buckets['1-30']?.amount || 0,
          days31to60: buckets['31-60']?.amount || 0,
          days61to90: buckets['61-90']?.amount || 0,
          over90: buckets['90+']?.amount || 0,
          total: result.totalOutstanding || 0,
        },
      }
    },
  })

  const getAgingBadge = (days: number) => {
    if (days <= 30) return 'bg-yellow-100 text-yellow-800'
    if (days <= 60) return 'bg-orange-100 text-orange-800'
    if (days <= 90) return 'bg-red-100 text-red-800'
    return 'bg-red-200 text-red-900'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/reports')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aging Report</h1>
          <p className="text-sm text-gray-500">Outstanding invoices by age</p>
        </div>
      </div>

      {/* Aging Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Current</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(data?.summary.current || 0)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">1-30 Days</p>
          <p className="text-xl font-bold text-yellow-600">{formatCurrency(data?.summary.days1to30 || 0)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">31-60 Days</p>
          <p className="text-xl font-bold text-orange-600">{formatCurrency(data?.summary.days31to60 || 0)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">61-90 Days</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(data?.summary.days61to90 || 0)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Over 90 Days</p>
          <p className="text-xl font-bold text-red-700">{formatCurrency(data?.summary.over90 || 0)}</p>
        </div>
        <div className="card bg-gray-50">
          <p className="text-sm text-gray-500">Total Outstanding</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(data?.summary.total || 0)}</p>
        </div>
      </div>

      {/* Warning for overdue */}
      {(data?.summary.over90 || 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          <div>
            <p className="font-medium text-red-800">Attention Required</p>
            <p className="text-sm text-red-600">
              You have {formatCurrency(data?.summary.over90 || 0)} in invoices over 90 days overdue
            </p>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Days Overdue</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{invoice.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invoice.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`badge ${getAgingBadge(invoice.daysOverdue)}`}>
                      {invoice.daysOverdue} days
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/invoices/${invoice.id}`)
                      }}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
