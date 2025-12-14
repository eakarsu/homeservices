'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeftIcon,
  CreditCardIcon,
  BanknotesIcon,
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  subtotal: number
  tax: number
  total: number
  paidAmount: number
  dueDate: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  items: {
    id: string
    description: string
    quantity: number
    unitPrice: number
    total: number
  }[]
}

export default function TechInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get('id')
  const jobId = searchParams.get('jobId')

  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH' | 'CHECK'>('CARD')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [showPayment, setShowPayment] = useState(false)

  const { data: invoice, isLoading, refetch } = useQuery<Invoice>({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${invoiceId}`)
      if (!res.ok) throw new Error('Failed to fetch invoice')
      return res.json()
    },
    enabled: !!invoiceId
  })

  const collectPaymentMutation = useMutation({
    mutationFn: async (data: { amount: number; method: string }) => {
      const res = await fetch(`/api/invoices/${invoiceId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to process payment')
      return res.json()
    },
    onSuccess: () => {
      refetch()
      setShowPayment(false)
      setPaymentAmount('')
    }
  })

  const sendInvoiceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Failed to send invoice')
      return res.json()
    },
    onSuccess: () => {
      refetch()
    }
  })

  const handleCollectPayment = () => {
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) return

    collectPaymentMutation.mutate({
      amount,
      method: paymentMethod
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Invoice not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-primary-600 font-medium"
        >
          Go Back
        </button>
      </div>
    )
  }

  const balanceDue = invoice.total - invoice.paidAmount

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
          <p className="text-sm text-gray-500">
            {invoice.customer.firstName} {invoice.customer.lastName}
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
        invoice.status === 'PAID'
          ? 'bg-green-100 text-green-800'
          : invoice.status === 'SENT'
          ? 'bg-blue-100 text-blue-800'
          : invoice.status === 'OVERDUE'
          ? 'bg-red-100 text-red-800'
          : 'bg-gray-100 text-gray-800'
      }`}>
        {invoice.status}
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Line Items</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {invoice.items.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{item.description}</p>
                <p className="text-sm text-gray-500">
                  {item.quantity} × ${item.unitPrice.toFixed(2)}
                </p>
              </div>
              <p className="font-bold text-gray-900">${item.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">${invoice.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
            <span className="font-medium text-gray-900">Total</span>
            <span className="font-bold text-gray-900">${invoice.total.toFixed(2)}</span>
          </div>
          {invoice.paidAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Paid</span>
              <span className="font-medium text-green-600">-${invoice.paidAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg border-t border-gray-200 pt-2">
            <span className="font-bold text-gray-900">Balance Due</span>
            <span className="font-bold text-primary-600">${balanceDue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {invoice.status !== 'PAID' && (
        <div className="space-y-3">
          <button
            onClick={() => {
              setPaymentAmount(balanceDue.toFixed(2))
              setShowPayment(true)
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            <CreditCardIcon className="w-5 h-5" />
            Collect Payment
          </button>

          {invoice.status === 'DRAFT' && (
            <button
              onClick={() => sendInvoiceMutation.mutate()}
              disabled={sendInvoiceMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              <DocumentTextIcon className="w-5 h-5" />
              {sendInvoiceMutation.isPending ? 'Sending...' : 'Send to Customer'}
            </button>
          )}
        </div>
      )}

      {invoice.status === 'PAID' && (
        <div className="flex items-center justify-center gap-2 p-4 bg-green-50 rounded-lg text-green-700">
          <CheckCircleIcon className="w-6 h-6" />
          <span className="font-medium">Paid in Full</span>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Collect Payment</h3>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['CARD', 'CASH', 'CHECK'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      paymentMethod === method
                        ? 'border-primary-600 bg-primary-50 text-primary-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {method === 'CARD' && <CreditCardIcon className="w-6 h-6" />}
                    {method === 'CASH' && <BanknotesIcon className="w-6 h-6" />}
                    {method === 'CHECK' && <DocumentTextIcon className="w-6 h-6" />}
                    <span className="text-sm font-medium">{method}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Balance due: ${balanceDue.toFixed(2)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPayment(false)
                  setPaymentAmount('')
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCollectPayment}
                disabled={collectPaymentMutation.isPending || !paymentAmount}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircleIcon className="w-5 h-5" />
                {collectPaymentMutation.isPending ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
