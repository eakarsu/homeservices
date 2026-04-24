'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useFormValidation } from '@/hooks/useFormValidation'
import type { FieldRules } from '@/lib/validation'

const customerRules: FieldRules = {
  firstName: [{ type: 'required', message: 'First name is required' }],
  lastName: [{ type: 'required', message: 'Last name is required' }],
  email: [{ type: 'email', message: 'Invalid email address' }],
  phone: [
    { type: 'required', message: 'Phone is required' },
    { type: 'phone', message: 'Invalid phone number' },
  ],
  propertyAddress: [{ type: 'required', message: 'Address is required' }],
  propertyCity: [{ type: 'required', message: 'City is required' }],
  propertyState: [{ type: 'required', message: 'State is required' }],
  propertyZip: [
    { type: 'required', message: 'ZIP code is required' },
    { type: 'zip', message: 'Invalid ZIP code (e.g., 12345 or 12345-6789)' },
  ],
}

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

  const { errors, touched, markTouched, validateOne, validateAll } = useFormValidation(customerRules)

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
    if (!validateAll(formData as unknown as Record<string, string>)) return
    createMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (touched[e.target.name]) validateOne(e.target.name, e.target.value)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    markTouched(e.target.name)
    validateOne(e.target.name, e.target.value)
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
              <label htmlFor="firstName" className="label">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input ${touched.firstName && errors.firstName ? 'border-red-500' : ''}`}
              />
              {touched.firstName && errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="label">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input ${touched.lastName && errors.lastName ? 'border-red-500' : ''}`}
              />
              {touched.lastName && errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
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
                onBlur={handleBlur}
                className={`input ${touched.email && errors.email ? 'border-red-500' : ''}`}
              />
              {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="label">Phone *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input ${touched.phone && errors.phone ? 'border-red-500' : ''}`}
              />
              {touched.phone && errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
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
                onBlur={handleBlur}
                className={`input ${touched.propertyAddress && errors.propertyAddress ? 'border-red-500' : ''}`}
              />
              {touched.propertyAddress && errors.propertyAddress && <p className="text-red-500 text-xs mt-1">{errors.propertyAddress}</p>}
            </div>
            <div>
              <label className="label">City *</label>
              <input
                type="text"
                name="propertyCity"
                value={formData.propertyCity}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input ${touched.propertyCity && errors.propertyCity ? 'border-red-500' : ''}`}
              />
              {touched.propertyCity && errors.propertyCity && <p className="text-red-500 text-xs mt-1">{errors.propertyCity}</p>}
            </div>
            <div>
              <label className="label">State *</label>
              <input
                type="text"
                name="propertyState"
                value={formData.propertyState}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={2}
                className={`input ${touched.propertyState && errors.propertyState ? 'border-red-500' : ''}`}
              />
              {touched.propertyState && errors.propertyState && <p className="text-red-500 text-xs mt-1">{errors.propertyState}</p>}
            </div>
            <div>
              <label className="label">ZIP Code *</label>
              <input
                type="text"
                name="propertyZip"
                value={formData.propertyZip}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input ${touched.propertyZip && errors.propertyZip ? 'border-red-500' : ''}`}
              />
              {touched.propertyZip && errors.propertyZip && <p className="text-red-500 text-xs mt-1">{errors.propertyZip}</p>}
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
