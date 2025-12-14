'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PencilIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  PrinterIcon
} from '@heroicons/react/24/outline'
import { formatCurrency, getStatusColor, formatDate } from '@/lib/utils'

interface EstimateOption {
  id: string
  name: string
  description?: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  isRecommended: boolean
  lineItems: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
    category?: string
    isOptional: boolean
  }>
}

interface Estimate {
  id: string
  estimateNumber: string
  status: string
  createdAt: string
  expirationDate?: string
  approvedAt?: string
  selectedOption?: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  notes?: string
  terms?: string
  customer: {
    id: string
    firstName?: string
    lastName?: string
    companyName?: string
    email?: string
    phone?: string
  }
  job?: {
    id: string
    jobNumber: string
    title: string
  }
  options: EstimateOption[]
}

export default function EstimateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const estimateId = params.id as string

  const { data: estimate, isLoading } = useQuery<Estimate>({
    queryKey: ['estimate', estimateId],
    queryFn: async () => {
      const res = await fetch(`/api/estimates/${estimateId}`)
      if (!res.ok) throw new Error('Failed to fetch estimate')
      return res.json()
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] })
    },
  })

  const sendEstimateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/estimates/${estimateId}/send`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to send estimate')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] })
    },
  })

  const getCustomerName = () => {
    const personalName = `${estimate?.customer?.firstName || ''} ${estimate?.customer?.lastName || ''}`.trim()
    if (personalName && estimate?.customer?.companyName) {
      return `${personalName} (${estimate.customer.companyName})`
    }
    return personalName || estimate?.customer?.companyName || 'Unknown'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Estimate not found</p>
        <Link href="/dashboard/estimates" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to estimates
        </Link>
      </div>
    )
  }

  const canSend = estimate.status === 'DRAFT'
  const canApprove = ['SENT', 'VIEWED'].includes(estimate.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/estimates" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{estimate.estimateNumber}</h1>
              <span className={`badge ${getStatusColor(estimate.status)}`}>
                {estimate.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Created {formatDate(estimate.createdAt)}
              {estimate.expirationDate && ` • Expires ${formatDate(estimate.expirationDate)}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canSend && (
            <button
              onClick={() => sendEstimateMutation.mutate()}
              disabled={sendEstimateMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              Send to Customer
            </button>
          )}
          {canApprove && (
            <>
              <button
                onClick={() => updateStatusMutation.mutate('APPROVED')}
                disabled={updateStatusMutation.isPending}
                className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Mark Approved
              </button>
              <button
                onClick={() => updateStatusMutation.mutate('DECLINED')}
                disabled={updateStatusMutation.isPending}
                className="btn-secondary text-red-600 flex items-center gap-2"
              >
                <XCircleIcon className="w-4 h-4" />
                Declined
              </button>
            </>
          )}
          <button className="btn-secondary flex items-center gap-2">
            <PrinterIcon className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Options - Good/Better/Best */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Pricing Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {estimate.options.map((option, index) => (
                <div
                  key={option.id}
                  className={`card relative ${
                    option.isRecommended ? 'border-2 border-primary-500 shadow-lg' : ''
                  } ${
                    estimate.selectedOption === option.name.toLowerCase() ? 'ring-2 ring-green-500' : ''
                  }`}
                >
                  {option.isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs px-3 py-1 rounded-full">
                      Recommended
                    </div>
                  )}
                  <div className="text-center pt-2">
                    <h3 className="text-lg font-bold text-gray-900">{option.name}</h3>
                    {option.description && (
                      <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                    )}
                    <p className="text-3xl font-bold text-primary-600 mt-4">
                      {formatCurrency(option.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(option.subtotal)} + {formatCurrency(option.taxAmount)} tax
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {option.lineItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className={`${item.isOptional ? 'text-gray-400' : 'text-gray-700'}`}>
                          {item.isOptional && '(Optional) '}
                          {item.description}
                        </span>
                        <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                  {estimate.selectedOption === option.name.toLowerCase() && (
                    <div className="mt-4 pt-4 border-t text-center">
                      <span className="text-green-600 font-medium flex items-center justify-center gap-1">
                        <CheckCircleIcon className="w-5 h-5" />
                        Selected
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Terms */}
          {(estimate.notes || estimate.terms) && (
            <div className="card">
              {estimate.notes && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{estimate.notes}</p>
                </div>
              )}
              {estimate.terms && (
                <div>
                  <h3 className="font-medium mb-2">Terms & Conditions</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{estimate.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="card">
            <h2 className="font-semibold mb-4">Customer</h2>
            <Link
              href={`/dashboard/customers/${estimate.customer.id}`}
              className="block hover:bg-gray-50 -mx-2 px-2 py-2 rounded"
            >
              <p className="font-medium text-primary-600">{getCustomerName()}</p>
              {estimate.customer.email && (
                <p className="text-sm text-gray-600">{estimate.customer.email}</p>
              )}
              {estimate.customer.phone && (
                <p className="text-sm text-gray-600">{estimate.customer.phone}</p>
              )}
            </Link>
          </div>

          {/* Related Job */}
          {estimate.job && (
            <div className="card">
              <h2 className="font-semibold mb-4">Related Job</h2>
              <Link
                href={`/dashboard/jobs/${estimate.job.id}`}
                className="block hover:bg-gray-50 -mx-2 px-2 py-2 rounded"
              >
                <p className="font-medium text-primary-600">{estimate.job.jobNumber}</p>
                <p className="text-sm text-gray-600">{estimate.job.title}</p>
              </Link>
            </div>
          )}

          {/* Summary */}
          <div className="card">
            <h2 className="font-semibold mb-4">Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(estimate.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span>{formatCurrency(estimate.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-600">{formatCurrency(estimate.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {estimate.status === 'APPROVED' && (
            <div className="card bg-green-50">
              <h2 className="font-semibold mb-2 text-green-800">Convert to Job</h2>
              <p className="text-sm text-green-700 mb-4">
                This estimate has been approved. Create a job to schedule the work.
              </p>
              <Link
                href={`/dashboard/jobs/new?estimateId=${estimateId}`}
                className="btn-primary w-full text-center block"
              >
                Create Job from Estimate
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
