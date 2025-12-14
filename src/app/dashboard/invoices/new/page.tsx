'use client'

import { useState, Suspense } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category: string
}

function NewInvoiceForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const preSelectedCustomerId = searchParams.get('customerId') || ''
  const preSelectedJobId = searchParams.get('jobId') || ''

  const [customerId, setCustomerId] = useState(preSelectedCustomerId)
  const [jobId, setJobId] = useState(preSelectedJobId)
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString().split('T')[0]
  })
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('Payment due within 30 days. Late fees may apply.')
  const [taxRate, setTaxRate] = useState(0.1)
  const [lineItems, setLineItems] = useState<LineItem[]>([])

  const { data: customers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await fetch('/api/customers?pageSize=100')
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data = await res.json()
      return data.data || []
    },
  })

  const { data: jobs } = useQuery({
    queryKey: ['customer-jobs', customerId],
    queryFn: async () => {
      if (!customerId) return []
      const res = await fetch(`/api/jobs?customerId=${customerId}`)
      if (!res.ok) throw new Error('Failed to fetch jobs')
      const data = await res.json()
      return data.data || []
    },
    enabled: !!customerId,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          jobId: jobId || undefined,
          dueDate,
          notes,
          terms,
          taxRate,
          lineItems,
        }),
      })
      if (!res.ok) throw new Error('Failed to create invoice')
      return res.json()
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      router.push(`/dashboard/invoices/${invoice.id}`)
    },
  })

  const addLineItem = () => {
    const newItem: LineItem = {
      id: `temp-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: 'Labor',
    }
    setLineItems([...lineItems, newItem])
  }

  const updateLineItem = (index: number, updates: Partial<LineItem>) => {
    const newItems = [...lineItems]
    const item = { ...newItems[index], ...updates }
    item.totalPrice = item.quantity * item.unitPrice
    newItems[index] = item
    setLineItems(newItems)
  }

  const removeLineItem = (index: number) => {
    const newItems = [...lineItems]
    newItems.splice(index, 1)
    setLineItems(newItems)
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount

  const getCustomerName = (customer: { firstName?: string; lastName?: string; companyName?: string }) => {
    const personalName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
    if (personalName && customer.companyName) {
      return `${personalName} (${customer.companyName})`
    }
    return personalName || customer.companyName || 'Unknown'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/invoices" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Job */}
          <div className="card">
            <h2 className="font-semibold mb-4">Customer & Job</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customerId" className="label">Customer *</label>
                <select
                  id="customerId"
                  name="customerId"
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value)
                    setJobId('')
                  }}
                  className="input"
                  required
                >
                  <option value="">Select customer...</option>
                  {customers?.map((customer: { id: string; firstName?: string; lastName?: string; companyName?: string }) => (
                    <option key={customer.id} value={customer.id}>
                      {getCustomerName(customer)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Related Job (optional)</label>
                <select
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="input"
                  disabled={!customerId}
                >
                  <option value="">Select job...</option>
                  {jobs?.map((job: { id: string; jobNumber: string; title: string }) => (
                    <option key={job.id} value={job.id}>
                      {job.jobNumber} - {job.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Line Items</h2>
              <button
                onClick={addLineItem}
                className="btn-secondary text-sm flex items-center gap-1"
              >
                <PlusIcon className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {lineItems.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 w-20">Category</th>
                    <th className="pb-2 w-20 text-right">Qty</th>
                    <th className="pb-2 w-28 text-right">Unit Price</th>
                    <th className="pb-2 w-28 text-right">Total</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, { description: e.target.value })}
                          className="input"
                          placeholder="Description"
                        />
                      </td>
                      <td className="py-2">
                        <select
                          value={item.category}
                          onChange={(e) => updateLineItem(index, { category: e.target.value })}
                          className="input text-sm"
                        >
                          <option value="Labor">Labor</option>
                          <option value="Parts">Parts</option>
                          <option value="Equipment">Equipment</option>
                          <option value="Other">Other</option>
                        </select>
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, { quantity: parseInt(e.target.value) || 0 })}
                          className="input text-right"
                          min="1"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                          className="input text-right"
                          step="0.01"
                        />
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(item.totalPrice)}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => removeLineItem(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No line items yet. Click "Add Item" to start.
              </p>
            )}
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="font-semibold mb-4">Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="input"
                placeholder="Notes to customer..."
              />
            </div>
            <div className="card">
              <h2 className="font-semibold mb-4">Terms</h2>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Due Date */}
          <div className="card">
            <h2 className="font-semibold mb-4">Due Date</h2>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input"
            />
          </div>

          {/* Tax Rate */}
          <div className="card">
            <h2 className="font-semibold mb-4">Tax Rate</h2>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={taxRate * 100}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) / 100)}
                className="input w-24"
                step="0.1"
                min="0"
                max="20"
              />
              <span>%</span>
            </div>
          </div>

          {/* Summary */}
          <div className="card bg-gray-50">
            <h2 className="font-semibold mb-4">Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({(taxRate * 100).toFixed(1)}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!customerId || lineItems.length === 0 || createMutation.isPending}
              className="btn-primary w-full"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </button>
            <Link href="/dashboard/invoices" className="btn-secondary w-full text-center block">
              Cancel
            </Link>
          </div>

          {createMutation.isError && (
            <p className="text-red-600 text-sm">{createMutation.error.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <NewInvoiceForm />
    </Suspense>
  )
}
