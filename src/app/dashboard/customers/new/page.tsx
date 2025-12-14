'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface CustomerFormData {
  firstName: string
  lastName: string
  companyName: string
  email: string
  phone: string
  alternatePhone: string
  preferredContact: string
  source: string
  notes: string
  // Property fields
  propertyAddress: string
  propertyCity: string
  propertyState: string
  propertyZip: string
  propertyType: string
}

export default function NewCustomerPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    preferredContact: 'PHONE',
    source: '',
    notes: '',
    propertyAddress: '',
    propertyCity: '',
    propertyState: '',
    propertyZip: '',
    propertyType: 'RESIDENTIAL',
  })

  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create customer')
      }
      return res.json()
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      router.push(`/dashboard/customers/${customer.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Customer</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="label">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="label">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="companyName" className="label">Company Name</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="phone" className="label">Phone *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Alternate Phone</label>
              <input
                type="tel"
                name="alternatePhone"
                value={formData.alternatePhone}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Preferred Contact</label>
              <select
                name="preferredContact"
                value={formData.preferredContact}
                onChange={handleChange}
                className="input"
              >
                <option value="PHONE">Phone</option>
                <option value="EMAIL">Email</option>
                <option value="TEXT">Text</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Source</label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select source...</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Google">Google</option>
                <option value="Yelp">Yelp</option>
                <option value="Facebook">Facebook</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Property Information */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Primary Property</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="propertyAddress" className="label">Address *</label>
              <input
                type="text"
                id="propertyAddress"
                name="propertyAddress"
                value={formData.propertyAddress}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">City *</label>
              <input
                type="text"
                name="propertyCity"
                value={formData.propertyCity}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">State *</label>
              <input
                type="text"
                name="propertyState"
                value={formData.propertyState}
                onChange={handleChange}
                required
                maxLength={2}
                className="input"
              />
            </div>
            <div>
              <label className="label">ZIP Code *</label>
              <input
                type="text"
                name="propertyZip"
                value={formData.propertyZip}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Property Type</label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className="input"
              >
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INDUSTRIAL">Industrial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="input"
            placeholder="Any additional notes about this customer..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/customers" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Customer'}
          </button>
        </div>

        {createMutation.isError && (
          <p className="text-red-600 text-sm">{createMutation.error.message}</p>
        )}
      </form>
    </div>
  )
}
