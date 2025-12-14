'use client'

import { useState, useEffect, Suspense } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'

interface AgreementPlan {
  id: string
  name: string
  description?: string
  tradeType: string
  monthlyPrice: number
  annualPrice: number
  visitsIncluded: number
  laborDiscount: number
  partsDiscount: number
  priorityService: boolean
}

interface Customer {
  id: string
  firstName?: string
  lastName?: string
  companyName?: string
}

function NewAgreementForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  // Get customerId from URL params if provided
  const preselectedCustomerId = searchParams.get('customerId') || ''

  const [customerId, setCustomerId] = useState(preselectedCustomerId)
  const [planId, setPlanId] = useState('')
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'annual'>('monthly')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [autoRenew, setAutoRenew] = useState(true)
  const [notes, setNotes] = useState('')

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await fetch('/api/customers?pageSize=100')
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data = await res.json()
      return data.data || []
    },
  })

  const { data: plans } = useQuery<AgreementPlan[]>({
    queryKey: ['agreement-plans'],
    queryFn: async () => {
      const res = await fetch('/api/agreement-plans')
      if (!res.ok) throw new Error('Failed to fetch plans')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const start = new Date(startDate)
      const end = new Date(start)
      end.setFullYear(end.getFullYear() + 1)

      const res = await fetch('/api/agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          planId,
          billingFrequency,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          autoRenew,
          notes,
        }),
      })
      if (!res.ok) throw new Error('Failed to create agreement')
      return res.json()
    },
    onSuccess: (agreement) => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] })
      router.push(`/dashboard/agreements/${agreement.id}`)
    },
  })

  const getCustomerName = (customer: Customer) => {
    const personalName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
    if (personalName && customer.companyName) {
      return `${personalName} (${customer.companyName})`
    }
    return personalName || customer.companyName || 'Unknown'
  }

  const selectedPlan = plans?.find(p => p.id === planId)
  const price = selectedPlan
    ? billingFrequency === 'monthly'
      ? Number(selectedPlan.monthlyPrice)
      : Number(selectedPlan.annualPrice)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/agreements" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Service Agreement</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
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
              {customers?.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {getCustomerName(customer)}
                </option>
              ))}
            </select>
          </div>

          {/* Plan Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Select Plan</h2>
            {plans && plans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setPlanId(plan.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      planId === plan.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{plan.name}</h3>
                      <span className="badge bg-gray-100 text-gray-700 text-xs">
                        {plan.tradeType}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                    )}
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Monthly</span>
                        <span className="font-medium">{formatCurrency(Number(plan.monthlyPrice))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Annual</span>
                        <span className="font-medium">{formatCurrency(Number(plan.annualPrice))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Visits/Year</span>
                        <span className="font-medium">{plan.visitsIncluded}</span>
                      </div>
                      {plan.laborDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Labor Discount</span>
                          <span>{plan.laborDiscount}%</span>
                        </div>
                      )}
                      {plan.partsDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Parts Discount</span>
                          <span>{plan.partsDiscount}%</span>
                        </div>
                      )}
                      {plan.priorityService && (
                        <div className="text-primary-600 text-xs mt-2">
                          Priority Service Included
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No plans available. Create plans in Settings first.
              </p>
            )}
          </div>

          {/* Agreement Details */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Agreement Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Billing Frequency</label>
                <select
                  value={billingFrequency}
                  onChange={(e) => setBillingFrequency(e.target.value as 'monthly' | 'annual')}
                  className="input"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual (Save ~10%)</option>
                </select>
              </div>
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoRenew}
                    onChange={(e) => setAutoRenew(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Auto-renew at end of term</span>
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="input"
              placeholder="Special terms or notes..."
            />
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Summary</h2>
            {selectedPlan ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Selected Plan</p>
                  <p className="font-semibold">{selectedPlan.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Billing</p>
                  <p className="font-semibold capitalize">{billingFrequency}</p>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">
                      {billingFrequency === 'monthly' ? 'Monthly' : 'Annual'} Price
                    </span>
                    <span>{formatCurrency(price)}</span>
                  </div>
                  {billingFrequency === 'monthly' && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Annual Total</span>
                      <span>{formatCurrency(price * 12)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Amount Due</span>
                    <span className="text-primary-600">{formatCurrency(price)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Select a plan to see summary</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!customerId || !planId || createMutation.isPending}
              className="btn-primary w-full"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Agreement'}
            </button>
            <Link href="/dashboard/agreements" className="btn-secondary w-full text-center">
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

export default function NewAgreementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <NewAgreementForm />
    </Suspense>
  )
}
