'use client'

import { useState, Suspense } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category: string
  isOptional: boolean
}

interface Option {
  name: string
  description: string
  lineItems: LineItem[]
  isRecommended: boolean
}

function NewEstimateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const preSelectedCustomerId = searchParams.get('customerId') || ''
  const preSelectedJobId = searchParams.get('jobId') || ''

  const [customerId, setCustomerId] = useState(preSelectedCustomerId)
  const [jobId, setJobId] = useState(preSelectedJobId)
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('Estimate valid for 30 days. Payment due upon completion.')
  const [taxRate, setTaxRate] = useState(0.1)

  const [options, setOptions] = useState<Option[]>([
    { name: 'Good', description: 'Basic solution', lineItems: [], isRecommended: false },
    { name: 'Better', description: 'Recommended option', lineItems: [], isRecommended: true },
    { name: 'Best', description: 'Premium solution', lineItems: [], isRecommended: false },
  ])

  const { data: customers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await fetch('/api/customers?pageSize=100')
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data = await res.json()
      return data.data || []
    },
  })

  const { data: pricebookItems } = useQuery({
    queryKey: ['pricebook'],
    queryFn: async () => {
      const res = await fetch('/api/pricebook')
      if (!res.ok) throw new Error('Failed to fetch pricebook')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const optionsWithTotals = options.map(opt => {
        const subtotal = opt.lineItems.reduce((sum, item) => sum + item.totalPrice, 0)
        const taxAmount = subtotal * taxRate
        return {
          ...opt,
          subtotal,
          taxAmount,
          totalAmount: subtotal + taxAmount,
        }
      })

      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          jobId: jobId || undefined,
          notes,
          terms,
          options: optionsWithTotals,
        }),
      })
      if (!res.ok) throw new Error('Failed to create estimate')
      return res.json()
    },
    onSuccess: (estimate) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      router.push(`/dashboard/estimates/${estimate.id}`)
    },
  })

  const addLineItem = (optionIndex: number) => {
    const newItem: LineItem = {
      id: `temp-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: 'Labor',
      isOptional: false,
    }
    const newOptions = [...options]
    newOptions[optionIndex].lineItems.push(newItem)
    setOptions(newOptions)
  }

  const updateLineItem = (optionIndex: number, itemIndex: number, updates: Partial<LineItem>) => {
    const newOptions = [...options]
    const item = { ...newOptions[optionIndex].lineItems[itemIndex], ...updates }
    item.totalPrice = item.quantity * item.unitPrice
    newOptions[optionIndex].lineItems[itemIndex] = item
    setOptions(newOptions)
  }

  const removeLineItem = (optionIndex: number, itemIndex: number) => {
    const newOptions = [...options]
    newOptions[optionIndex].lineItems.splice(itemIndex, 1)
    setOptions(newOptions)
  }

  const addFromPricebook = (optionIndex: number, pricebookItem: { name: string; unitPrice: number; category: string }) => {
    const newItem: LineItem = {
      id: `temp-${Date.now()}`,
      description: pricebookItem.name,
      quantity: 1,
      unitPrice: pricebookItem.unitPrice,
      totalPrice: pricebookItem.unitPrice,
      category: pricebookItem.category,
      isOptional: false,
    }
    const newOptions = [...options]
    newOptions[optionIndex].lineItems.push(newItem)
    setOptions(newOptions)
  }

  const copyToOtherOptions = (fromIndex: number) => {
    const newOptions = [...options]
    const sourceItems = newOptions[fromIndex].lineItems
    newOptions.forEach((opt, i) => {
      if (i !== fromIndex) {
        opt.lineItems = sourceItems.map(item => ({ ...item, id: `temp-${Date.now()}-${i}` }))
      }
    })
    setOptions(newOptions)
  }

  const getOptionTotal = (option: Option) => {
    const subtotal = option.lineItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const tax = subtotal * taxRate
    return { subtotal, tax, total: subtotal + tax }
  }

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
        <Link href="/dashboard/estimates" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Estimate</h1>
      </div>

      {/* Customer Selection */}
      <div className="card">
        <label htmlFor="customerId" className="text-lg font-semibold mb-4 block">Customer</label>
        <select
          id="customerId"
          name="customerId"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
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

      {/* Estimate Title */}
      <div className="card">
        <label htmlFor="title" className="text-lg font-semibold mb-4 block">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          placeholder="Estimate title..."
          className="input"
        />
      </div>

      {/* Line Items Section */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Line Items</h2>
      </div>

      {/* Good/Better/Best Options */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pricing Options (Good/Better/Best)</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Tax Rate:</label>
            <input
              type="number"
              value={taxRate * 100}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) / 100)}
              className="input w-20"
              step="0.1"
              min="0"
              max="20"
            />
            <span className="text-sm text-gray-600">%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {options.map((option, optionIndex) => {
            const totals = getOptionTotal(option)
            return (
              <div
                key={option.name}
                className={`card ${option.isRecommended ? 'border-2 border-primary-500' : ''}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <input
                      type="text"
                      value={option.name}
                      onChange={(e) => {
                        const newOptions = [...options]
                        newOptions[optionIndex].name = e.target.value
                        setOptions(newOptions)
                      }}
                      className="font-bold text-lg bg-transparent border-none p-0 focus:ring-0"
                    />
                    <input
                      type="text"
                      value={option.description}
                      onChange={(e) => {
                        const newOptions = [...options]
                        newOptions[optionIndex].description = e.target.value
                        setOptions(newOptions)
                      }}
                      className="text-sm text-gray-500 bg-transparent border-none p-0 focus:ring-0 w-full"
                      placeholder="Description..."
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="recommended"
                      checked={option.isRecommended}
                      onChange={() => {
                        const newOptions = options.map((o, i) => ({
                          ...o,
                          isRecommended: i === optionIndex,
                        }))
                        setOptions(newOptions)
                      }}
                    />
                    Recommended
                  </label>
                </div>

                {/* Line Items */}
                <div className="space-y-2 mb-4">
                  {option.lineItems.map((item, itemIndex) => (
                    <div key={item.id} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(optionIndex, itemIndex, { description: e.target.value })}
                          className="input text-sm mb-1"
                          placeholder="Description"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(optionIndex, itemIndex, { quantity: parseInt(e.target.value) || 0 })}
                            className="input text-sm w-16"
                            placeholder="Qty"
                            min="1"
                          />
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(optionIndex, itemIndex, { unitPrice: parseFloat(e.target.value) || 0 })}
                            className="input text-sm w-24"
                            placeholder="Price"
                            step="0.01"
                          />
                          <span className="text-sm font-medium py-2">
                            {formatCurrency(item.totalPrice)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeLineItem(optionIndex, itemIndex)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Item Buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => addLineItem(optionIndex)}
                    className="btn-secondary text-sm flex items-center gap-1 flex-1"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                {/* Copy to Others */}
                {option.lineItems.length > 0 && (
                  <button
                    onClick={() => copyToOtherOptions(optionIndex)}
                    className="text-xs text-primary-600 hover:underline mb-4"
                  >
                    Copy items to other options
                  </button>
                )}

                {/* Totals */}
                <div className="pt-4 border-t space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax ({(taxRate * 100).toFixed(1)}%)</span>
                    <span>{formatCurrency(totals.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary-600">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Notes & Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="input"
            placeholder="Internal notes or special instructions..."
          />
        </div>
        <div className="card">
          <h2 className="font-semibold mb-4">Terms & Conditions</h2>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={4}
            className="input"
            placeholder="Payment terms, warranty info, etc..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/dashboard/estimates" className="btn-secondary">
          Cancel
        </Link>
        <button
          onClick={() => createMutation.mutate()}
          disabled={!customerId || createMutation.isPending}
          className="btn-primary"
        >
          {createMutation.isPending ? 'Creating...' : 'Create Estimate'}
        </button>
      </div>

      {createMutation.isError && (
        <p className="text-red-600 text-sm text-right">{createMutation.error.message}</p>
      )}
    </div>
  )
}

export default function NewEstimatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <NewEstimateForm />
    </Suspense>
  )
}
