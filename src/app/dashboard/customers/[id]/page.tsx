'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  PlusIcon,
  HomeIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { formatDateTime, getStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import StripeCardForm from '@/components/StripeCardForm'

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  propertyType: string
  equipment: Array<{
    id: string
    name: string
    equipmentType: string
    brand?: string
    model?: string
  }>
}

interface Customer {
  id: string
  customerNumber: string
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
  source?: string
  createdAt: string
  stripeCustomerId?: string
  properties: Property[]
  jobs: Array<{
    id: string
    jobNumber: string
    title: string
    status: string
    scheduledStart?: string
    tradeType: string
  }>
  estimates: Array<{
    id: string
    estimateNumber: string
    status: string
    totalAmount: number
    createdAt: string
  }>
  invoices: Array<{
    id: string
    invoiceNumber: string
    status: string
    totalAmount: number
    dueDate?: string
  }>
}

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const customerId = params.id as string
  const [showPropertyModal, setShowPropertyModal] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    type: 'House',
    address: '',
    city: '',
    state: '',
    zip: '',
  })

  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${customerId}`)
      if (!res.ok) throw new Error('Failed to fetch customer')
      return res.json()
    },
  })

  const { data: paymentMethodsData } = useQuery<{ paymentMethods: PaymentMethod[] }>({
    queryKey: ['paymentMethods', customerId],
    queryFn: async () => {
      const res = await fetch(`/api/stripe/payment-methods?customerId=${customerId}`)
      if (!res.ok) throw new Error('Failed to fetch payment methods')
      return res.json()
    },
    enabled: !!customerId,
  })

  const paymentMethods = paymentMethodsData?.paymentMethods || []

  const deleteCardMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const res = await fetch(`/api/stripe/payment-methods?paymentMethodId=${paymentMethodId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete card')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods', customerId] })
      toast.success('Card removed successfully')
    },
    onError: () => {
      toast.error('Failed to remove card')
    }
  })

  const createPropertyMutation = useMutation({
    mutationFn: async (data: typeof propertyForm) => {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, customerId }),
      })
      if (!res.ok) throw new Error('Failed to create property')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
      toast.success('Property added successfully')
      setShowPropertyModal(false)
      setPropertyForm({ name: '', type: 'House', address: '', city: '', state: '', zip: '' })
    },
    onError: () => {
      toast.error('Failed to add property')
    }
  })

  const getCustomerName = () => {
    const personalName = `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim()
    if (personalName && customer?.companyName) {
      return `${personalName} (${customer.companyName})`
    }
    return personalName || customer?.companyName || 'Unknown'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
        <Link href="/dashboard/customers" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to customers
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/customers"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getCustomerName()}</h1>
            <p className="text-sm text-gray-500">#{customer.customerNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/customers/${customerId}/edit`}
            className="btn-secondary flex items-center gap-2"
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </Link>
          <Link
            href={`/dashboard/jobs/new?customerId=${customerId}`}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            New Job
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-3 text-gray-600 hover:text-primary-600">
                  <PhoneIcon className="w-5 h-5" />
                  {customer.phone}
                </a>
              )}
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-3 text-gray-600 hover:text-primary-600">
                  <EnvelopeIcon className="w-5 h-5" />
                  {customer.email}
                </a>
              )}
              {customer.source && (
                <p className="text-sm text-gray-500">Source: {customer.source}</p>
              )}
              <p className="text-sm text-gray-500">Customer since {new Date(customer.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Properties */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <HomeIcon className="w-5 h-5" />
                Properties ({customer.properties.length})
              </h2>
              <button
                onClick={() => setShowPropertyModal(true)}
                className="text-primary-600 text-sm hover:underline"
              >
                Add
              </button>
            </div>
            <div className="space-y-3">
              {customer.properties.map((property) => (
                <div key={property.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{property.name || property.propertyType}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    {property.address}, {property.city}, {property.state} {property.zip}
                  </p>
                  {property.equipment.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Equipment:</p>
                      {property.equipment.map((eq) => (
                        <span key={eq.id} className="inline-block text-xs bg-gray-200 px-2 py-1 rounded mr-1 mb-1">
                          {eq.name || eq.equipmentType}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {customer.properties.length === 0 && (
                <p className="text-gray-500 text-sm">No properties yet</p>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5" />
                Payment Methods
              </h2>
              <button
                onClick={() => setShowCardModal(true)}
                className="text-primary-600 text-sm hover:underline"
              >
                Add Card
              </button>
            </div>
            <div className="space-y-3">
              {paymentMethods.map((card) => (
                <div key={card.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 bg-gradient-to-r from-gray-700 to-gray-900 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {card.brand?.toUpperCase().slice(0, 4)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">•••• {card.last4}</p>
                      <p className="text-xs text-gray-500">
                        Expires {card.expMonth}/{card.expYear}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCardMutation.mutate(card.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove card"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {paymentMethods.length === 0 && (
                <p className="text-gray-500 text-sm">No payment methods saved</p>
              )}
            </div>
          </div>
        </div>

        {/* Jobs, Estimates, Invoices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Jobs */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <WrenchScrewdriverIcon className="w-5 h-5" />
                Jobs ({customer.jobs.length})
              </h2>
              <Link href={`/dashboard/jobs/new?customerId=${customerId}`} className="text-primary-600 text-sm hover:underline">
                New Job
              </Link>
            </div>
            <div className="space-y-2">
              {customer.jobs.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div>
                    <p className="font-medium">{job.jobNumber}</p>
                    <p className="text-sm text-gray-600">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.tradeType}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                    {job.scheduledStart && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(job.scheduledStart)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
              {customer.jobs.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No jobs yet</p>
              )}
              {customer.jobs.length > 5 && (
                <Link href={`/jobs?customerId=${customerId}`} className="block text-center text-primary-600 text-sm hover:underline py-2">
                  View all {customer.jobs.length} jobs
                </Link>
              )}
            </div>
          </div>

          {/* Estimates */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5" />
                Estimates ({customer.estimates.length})
              </h2>
              <Link href={`/dashboard/estimates/new?customerId=${customerId}`} className="text-primary-600 text-sm hover:underline">
                New Estimate
              </Link>
            </div>
            <div className="space-y-2">
              {customer.estimates.slice(0, 5).map((estimate) => (
                <Link
                  key={estimate.id}
                  href={`/dashboard/estimates/${estimate.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div>
                    <p className="font-medium">{estimate.estimateNumber}</p>
                    <p className="text-xs text-gray-500">{new Date(estimate.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${getStatusColor(estimate.status)}`}>
                      {estimate.status}
                    </span>
                    <p className="text-sm font-medium mt-1">
                      ${estimate.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
              {customer.estimates.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No estimates yet</p>
              )}
            </div>
          </div>

          {/* Invoices */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CurrencyDollarIcon className="w-5 h-5" />
                Invoices ({customer.invoices.length})
              </h2>
              <Link href={`/dashboard/invoices/new?customerId=${customerId}`} className="text-primary-600 text-sm hover:underline">
                New Invoice
              </Link>
            </div>
            <div className="space-y-2">
              {customer.invoices.slice(0, 5).map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    {invoice.dueDate && (
                      <p className="text-xs text-gray-500">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`badge ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                    <p className="text-sm font-medium mt-1">
                      ${invoice.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
              {customer.invoices.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No invoices yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Property Modal */}
      {showPropertyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Property</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Property Name</label>
                <input
                  type="text"
                  value={propertyForm.name}
                  onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Primary Residence, Office"
                />
              </div>
              <div>
                <label className="label">Property Type</label>
                <select
                  value={propertyForm.type}
                  onChange={(e) => setPropertyForm({ ...propertyForm, type: e.target.value })}
                  className="input"
                >
                  <option value="House">House</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Condo">Condo</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Office">Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Address *</label>
                <input
                  type="text"
                  value={propertyForm.address}
                  onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                  className="input"
                  placeholder="Street address"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">City *</label>
                  <input
                    type="text"
                    value={propertyForm.city}
                    onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">State *</label>
                  <input
                    type="text"
                    value={propertyForm.state}
                    onChange={(e) => setPropertyForm({ ...propertyForm, state: e.target.value })}
                    className="input"
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <label className="label">ZIP *</label>
                  <input
                    type="text"
                    value={propertyForm.zip}
                    onChange={(e) => setPropertyForm({ ...propertyForm, zip: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPropertyModal(false)
                  setPropertyForm({ name: '', type: 'House', address: '', city: '', state: '', zip: '' })
                }}
                className="btn-secondary"
                disabled={createPropertyMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => createPropertyMutation.mutate(propertyForm)}
                className="btn-primary"
                disabled={!propertyForm.address || !propertyForm.city || !propertyForm.state || !propertyForm.zip || createPropertyMutation.isPending}
              >
                {createPropertyMutation.isPending ? 'Adding...' : 'Add Property'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Payment Method</h3>
            <p className="text-gray-600 mb-6">
              Add a credit or debit card for this customer. This card will be securely stored with Stripe and can be used for recurring payments.
            </p>
            <StripeCardForm
              customerId={customerId}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['paymentMethods', customerId] })
                toast.success('Card added successfully')
                setShowCardModal(false)
              }}
              onCancel={() => setShowCardModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
