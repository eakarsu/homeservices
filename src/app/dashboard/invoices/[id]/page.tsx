'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CurrencyDollarIcon,
  PrinterIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { formatCurrency, getStatusColor, formatDate } from '@/lib/utils'

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  issueDate: string
  dueDate: string
  paidDate?: string
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  balanceDue: number
  notes?: string
  terms?: string
  customer: {
    id: string
    firstName?: string
    lastName?: string
    companyName?: string
    email?: string
    phone?: string
    billingAddress?: string
    billingCity?: string
    billingState?: string
    billingZip?: string
  }
  job?: {
    id: string
    jobNumber: string
    title: string
  }
  lineItems: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
    category?: string
  }>
  payments: Array<{
    id: string
    amount: number
    method: string
    reference?: string
    date: string
    notes?: string
  }>
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const invoiceId = params.id as string
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD')
  const [paymentReference, setPaymentReference] = useState('')

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${invoiceId}`)
      if (!res.ok) throw new Error('Failed to fetch invoice')
      return res.json()
    },
  })

  const sendInvoiceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to send invoice')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
    },
  })

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${invoiceId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          reference: paymentReference,
        }),
      })
      if (!res.ok) throw new Error('Failed to record payment')
      return res.json()
    },
    onSuccess: () => {
      setShowPaymentModal(false)
      setPaymentAmount('')
      setPaymentReference('')
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
    },
  })

  const getCustomerName = () => {
    const personalName = `${invoice?.customer?.firstName || ''} ${invoice?.customer?.lastName || ''}`.trim()
    if (personalName && invoice?.customer?.companyName) {
      return `${personalName} (${invoice.customer.companyName})`
    }
    return personalName || invoice?.customer?.companyName || 'Unknown'
  }

  const isOverdue = () => {
    if (!invoice?.dueDate || invoice.status === 'PAID') return false
    return new Date(invoice.dueDate) < new Date()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found</p>
        <Link href="/dashboard/invoices" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to invoices
        </Link>
      </div>
    )
  }

  const canSend = invoice.status === 'DRAFT'
  const canRecordPayment = invoice.balanceDue > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/invoices" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              <span className={`badge ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
              {isOverdue() && (
                <span className="badge bg-red-100 text-red-700">OVERDUE</span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Issued {formatDate(invoice.issueDate)} • Due {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canSend && (
            <button
              onClick={() => sendInvoiceMutation.mutate()}
              disabled={sendInvoiceMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              Send to Customer
            </button>
          )}
          {canRecordPayment && (
            <button
              onClick={() => {
                setPaymentAmount(invoice.balanceDue.toString())
                setShowPaymentModal(true)
              }}
              className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <CurrencyDollarIcon className="w-4 h-4" />
              Record Payment
            </button>
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
          {/* Line Items */}
          <div className="card">
            <h2 className="font-semibold mb-4">Line Items</h2>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3">
                      <p>{item.description}</p>
                      {item.category && (
                        <p className="text-xs text-gray-500">{item.category}</p>
                      )}
                    </td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-4 text-right text-gray-500">Subtotal</td>
                  <td className="pt-4 text-right">{formatCurrency(invoice.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="pt-1 text-right text-gray-500">
                    Tax ({(invoice.taxRate * 100).toFixed(1)}%)
                  </td>
                  <td className="pt-1 text-right">{formatCurrency(invoice.taxAmount)}</td>
                </tr>
                <tr className="font-bold text-lg">
                  <td colSpan={3} className="pt-2 text-right border-t">Total</td>
                  <td className="pt-2 text-right border-t">{formatCurrency(invoice.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payments */}
          {invoice.payments.length > 0 && (
            <div className="card">
              <h2 className="font-semibold mb-4">Payment History</h2>
              <div className="space-y-2">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-green-600">
                        {payment.method.replace('_', ' ')}
                        {payment.reference && ` • ${payment.reference}`}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(payment.date)}</p>
                    </div>
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {(invoice.notes || invoice.terms) && (
            <div className="card">
              {invoice.notes && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-gray-700">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h3 className="font-medium mb-2">Terms</h3>
                  <p className="text-sm text-gray-600">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Balance */}
          <div className={`card ${invoice.balanceDue > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
            <h2 className="font-semibold mb-2">Balance Due</h2>
            <p className={`text-3xl font-bold ${invoice.balanceDue > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {formatCurrency(invoice.balanceDue)}
            </p>
            {invoice.paidAmount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Paid: {formatCurrency(invoice.paidAmount)}
              </p>
            )}
          </div>

          {/* Customer */}
          <div className="card">
            <h2 className="font-semibold mb-4">Bill To</h2>
            <Link
              href={`/dashboard/customers/${invoice.customer.id}`}
              className="block hover:bg-gray-50 -mx-2 px-2 py-2 rounded"
            >
              <p className="font-medium text-primary-600">{getCustomerName()}</p>
              {invoice.customer.billingAddress && (
                <p className="text-sm text-gray-600">
                  {invoice.customer.billingAddress}<br />
                  {invoice.customer.billingCity}, {invoice.customer.billingState} {invoice.customer.billingZip}
                </p>
              )}
              {invoice.customer.email && (
                <p className="text-sm text-gray-600 mt-1">{invoice.customer.email}</p>
              )}
            </Link>
          </div>

          {/* Related Job */}
          {invoice.job && (
            <div className="card">
              <h2 className="font-semibold mb-4">Related Job</h2>
              <Link
                href={`/dashboard/jobs/${invoice.job.id}`}
                className="block hover:bg-gray-50 -mx-2 px-2 py-2 rounded"
              >
                <p className="font-medium text-primary-600">{invoice.job.jobNumber}</p>
                <p className="text-sm text-gray-600">{invoice.job.title}</p>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Record Payment</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="input"
                  step="0.01"
                  max={invoice.balanceDue}
                />
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input"
                >
                  <option value="CASH">Cash</option>
                  <option value="CHECK">Check</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="ACH">ACH/Bank Transfer</option>
                  <option value="FINANCING">Financing</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Reference (optional)</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="input"
                  placeholder="Check number, last 4 digits, etc."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => recordPaymentMutation.mutate()}
                disabled={!paymentAmount || recordPaymentMutation.isPending}
                className="btn-primary"
              >
                {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
