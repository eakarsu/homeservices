'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const invoiceId = params.id as string
  const sessionId = searchParams.get('session_id')
  const [invoiceNumber, setInvoiceNumber] = useState('')

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/public`)
        if (res.ok) {
          const data = await res.json()
          setInvoiceNumber(data.invoiceNumber)
        }
      } catch {
        // Ignore errors
      }
    }
    fetchInvoice()
  }, [invoiceId])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>

        <p className="text-gray-600 mb-6">
          Thank you for your payment{invoiceNumber ? ` for Invoice #${invoiceNumber}` : ''}.
          A confirmation email will be sent to you shortly.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500">Reference</p>
          <p className="font-mono text-sm text-gray-700 break-all">{sessionId}</p>
        </div>

        <Link
          href={`/pay/${invoiceId}`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          View Invoice
        </Link>
      </div>
    </div>
  )
}
