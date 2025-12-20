'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CreditCardIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  issueDate: string
  dueDate: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  balanceDue: number
  customerName: string
  lineItems: LineItem[]
}

export default function PaymentPage() {
  const params = useParams()
  const invoiceId = params.id as string
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/public`)
        if (!res.ok) throw new Error('Invoice not found')
        const data = await res.json()
        setInvoice(data)
      } catch {
        setError('Invoice not found or no longer available')
      } finally {
        setLoading(false)
      }
    }
    fetchInvoice()
  }, [invoiceId])

  const handlePayment = async () => {
    setProcessing(true)
    setError('')

    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!invoice) return null

  const isPaid = invoice.status === 'PAID' || Number(invoice.balanceDue) <= 0

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pay Invoice</h1>
          <p className="text-gray-600 mt-2">Invoice #{invoice.invoiceNumber}</p>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Customer Info */}
          <div className="bg-primary-600 text-white p-6">
            <p className="text-primary-100 text-sm">Bill to</p>
            <p className="text-xl font-semibold">{invoice.customerName}</p>
          </div>

          {/* Invoice Details */}
          <div className="p-6">
            <div className="flex justify-between text-sm text-gray-600 mb-6">
              <div>
                <p className="font-medium text-gray-900">Issue Date</p>
                <p>{new Date(invoice.issueDate).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">Due Date</p>
                <p>{new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Line Items */}
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700">Description</th>
                    <th className="text-right p-3 font-medium text-gray-700">Qty</th>
                    <th className="text-right p-3 font-medium text-gray-700">Price</th>
                    <th className="text-right p-3 font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-right">{Number(item.quantity)}</td>
                      <td className="p-3 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                      <td className="p-3 text-right">${Number(item.totalPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              {Number(invoice.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>${Number(invoice.taxAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-base pt-2 border-t">
                <span>Total</span>
                <span>${Number(invoice.totalAmount).toFixed(2)}</span>
              </div>
              {Number(invoice.paidAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Paid</span>
                  <span>-${Number(invoice.paidAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Balance Due</span>
                <span className={isPaid ? 'text-green-600' : 'text-primary-600'}>
                  ${Number(invoice.balanceDue).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-gray-50 p-6 border-t">
            {isPaid ? (
              <div className="text-center">
                <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-semibold text-green-600">Paid in Full</p>
                <p className="text-gray-600 text-sm">Thank you for your payment!</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CreditCardIcon className="w-6 h-6" />
                  {processing ? 'Redirecting to payment...' : `Pay $${Number(invoice.balanceDue).toFixed(2)}`}
                </button>
                <p className="text-center text-gray-500 text-xs mt-4">
                  Secure payment powered by Stripe
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
