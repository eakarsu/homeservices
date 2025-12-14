'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  UserIcon,
  CreditCardIcon,
  CheckBadgeIcon,
  ClockIcon,
  PencilIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Agreement {
  id: string
  agreementNumber: string
  status: string
  startDate: string
  endDate: string
  renewalDate: string | null
  billingFrequency: string
  paymentMethod: string | null
  autoRenew: boolean
  visitsUsed: number
  lastVisitDate: string | null
  nextVisitDue: string | null
  notes: string | null
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  plan: {
    id: string
    name: string
    description: string | null
    monthlyPrice: number
    annualPrice: number
    visitsIncluded: number
    discountPct: number
    priorityService: boolean
    noDiagnosticFee: boolean
    includedServices: string[]
  }
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  EXPIRED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  SUSPENDED: 'bg-orange-100 text-orange-800',
}

export default function AgreementDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [editForm, setEditForm] = useState({
    status: '',
    billingFrequency: '',
    autoRenew: false,
    notes: '',
  })

  const { data: agreement, isLoading } = useQuery<Agreement>({
    queryKey: ['agreement', id],
    queryFn: async () => {
      const res = await fetch(`/api/agreements/${id}`)
      if (!res.ok) throw new Error('Failed to fetch agreement')
      return res.json()
    }
  })

  const renewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/agreements/${id}/renew`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Failed to renew agreement')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreement', id] })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const res = await fetch(`/api/agreements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update agreement')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreement', id] })
      toast.success('Agreement updated successfully')
      setShowEditModal(false)
    },
    onError: () => {
      toast.error('Failed to update agreement')
    }
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/agreements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (!res.ok) throw new Error('Failed to cancel agreement')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreement', id] })
      toast.success('Agreement cancelled')
      setShowCancelModal(false)
    },
    onError: () => {
      toast.error('Failed to cancel agreement')
    }
  })

  const openEditModal = () => {
    if (agreement) {
      setEditForm({
        status: agreement.status,
        billingFrequency: agreement.billingFrequency,
        autoRenew: agreement.autoRenew,
        notes: agreement.notes || '',
      })
      setShowEditModal(true)
    }
  }

  const handleScheduleVisit = () => {
    if (agreement) {
      router.push(`/dashboard/jobs/new?customerId=${agreement.customer.id}`)
    }
  }

  const handleSendReminder = () => {
    toast.success('Reminder sent to customer')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!agreement) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Agreement not found</p>
        <Link href="/dashboard/agreements" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to Agreements
        </Link>
      </div>
    )
  }

  const visitsRemaining = agreement.plan.visitsIncluded - agreement.visitsUsed
  const isExpiringSoon = agreement.endDate &&
    new Date(agreement.endDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Agreement #{agreement.agreementNumber}
            </h1>
            <p className="text-gray-500">
              {agreement.customer.firstName} {agreement.customer.lastName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            statusColors[agreement.status] || 'bg-gray-100 text-gray-800'
          )}>
            {agreement.status}
          </span>
          {agreement.status === 'ACTIVE' && isExpiringSoon && (
            <button
              onClick={() => renewMutation.mutate()}
              disabled={renewMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              {renewMutation.isPending ? 'Renewing...' : 'Renew Now'}
            </button>
          )}
          <button
            onClick={openEditModal}
            className="btn-secondary flex items-center gap-2"
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plan Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Details</h2>
            <div className="bg-primary-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-primary-900">{agreement.plan.name} Plan</h3>
                  <p className="text-primary-700">{agreement.plan.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-900">
                    ${agreement.billingFrequency === 'monthly'
                      ? Number(agreement.plan.monthlyPrice).toFixed(2)
                      : Number(agreement.plan.annualPrice).toFixed(2)}
                  </p>
                  <p className="text-sm text-primary-700">
                    per {agreement.billingFrequency === 'monthly' ? 'month' : 'year'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{agreement.plan.visitsIncluded}</p>
                <p className="text-sm text-gray-500">Visits Included</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{Number(agreement.plan.discountPct)}%</p>
                <p className="text-sm text-gray-500">Discount</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {agreement.plan.priorityService ? 'Yes' : 'No'}
                </p>
                <p className="text-sm text-gray-500">Priority Service</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {agreement.plan.noDiagnosticFee ? 'Free' : 'Paid'}
                </p>
                <p className="text-sm text-gray-500">Diagnostic Fee</p>
              </div>
            </div>

            {agreement.plan.includedServices.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Included Services</h4>
                <div className="flex flex-wrap gap-2">
                  {agreement.plan.includedServices.map((service, index) => (
                    <span key={index} className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                      <CheckBadgeIcon className="w-4 h-4 inline mr-1" />
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Visit Tracking */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Visit Tracking</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{agreement.visitsUsed}</p>
                <p className="text-sm text-blue-700">Visits Used</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{visitsRemaining}</p>
                <p className="text-sm text-green-700">Remaining</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-600">{agreement.plan.visitsIncluded}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary-600 h-3 rounded-full"
                style={{ width: `${(agreement.visitsUsed / agreement.plan.visitsIncluded) * 100}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Last Visit</p>
                <p className="font-medium">
                  {agreement.lastVisitDate
                    ? format(new Date(agreement.lastVisitDate), 'MMM d, yyyy')
                    : 'No visits yet'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Visit Due</p>
                <p className="font-medium">
                  {agreement.nextVisitDue
                    ? format(new Date(agreement.nextVisitDue), 'MMM d, yyyy')
                    : 'Not scheduled'}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {agreement.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{agreement.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-gray-400" />
              Customer
            </h3>
            <div className="space-y-2">
              <Link
                href={`/dashboard/customers/${agreement.customer.id}`}
                className="text-primary-600 hover:underline font-medium"
              >
                {agreement.customer.firstName} {agreement.customer.lastName}
              </Link>
              <p className="text-sm text-gray-600">{agreement.customer.email}</p>
              <p className="text-sm text-gray-600">{agreement.customer.phone}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
              Agreement Dates
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{format(new Date(agreement.startDate), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className={cn(
                  'font-medium',
                  isExpiringSoon && 'text-orange-600'
                )}>
                  {format(new Date(agreement.endDate), 'MMM d, yyyy')}
                  {isExpiringSoon && ' (Expiring Soon)'}
                </p>
              </div>
              {agreement.renewalDate && (
                <div>
                  <p className="text-sm text-gray-500">Renewal Date</p>
                  <p className="font-medium">{format(new Date(agreement.renewalDate), 'MMM d, yyyy')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Billing */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCardIcon className="w-5 h-5 text-gray-400" />
              Billing
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Billing Frequency</p>
                <p className="font-medium capitalize">{agreement.billingFrequency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium">{agreement.paymentMethod || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Auto Renew</p>
                <p className={cn(
                  'font-medium',
                  agreement.autoRenew ? 'text-green-600' : 'text-gray-600'
                )}>
                  {agreement.autoRenew ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleScheduleVisit}
                className="w-full btn-secondary text-sm"
              >
                Schedule Visit
              </button>
              <button
                onClick={handleSendReminder}
                className="w-full btn-secondary text-sm"
              >
                Send Reminder
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full btn-secondary text-sm text-red-600 hover:bg-red-50"
                disabled={agreement.status === 'CANCELLED'}
              >
                Cancel Agreement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Agreement</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="input"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="label">Billing Frequency</label>
                <select
                  value={editForm.billingFrequency}
                  onChange={(e) => setEditForm({ ...editForm, billingFrequency: e.target.value })}
                  className="input"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRenew"
                  checked={editForm.autoRenew}
                  onChange={(e) => setEditForm({ ...editForm, autoRenew: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="autoRenew" className="text-sm text-gray-700">Auto Renew</label>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-secondary"
                disabled={updateMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => updateMutation.mutate(editForm)}
                className="btn-primary"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Agreement</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this agreement? This will end the service agreement for{' '}
              <span className="font-medium">{agreement.customer.firstName} {agreement.customer.lastName}</span>.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn-secondary"
                disabled={cancelMutation.isPending}
              >
                Keep Agreement
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                className="btn-primary bg-red-600 hover:bg-red-700"
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Agreement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
