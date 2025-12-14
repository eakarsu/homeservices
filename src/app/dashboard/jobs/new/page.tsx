'use client'

import { useState, useEffect, Suspense } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface JobFormData {
  customerId: string
  propertyId: string
  serviceTypeId: string
  title: string
  description: string
  priority: string
  jobType: string
  tradeType: string
  scheduledStart: string
  timeWindowStart: string
  timeWindowEnd: string
  estimatedDuration: number
}

function NewJobForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const preSelectedCustomerId = searchParams.get('customerId') || ''
  const preSelectedPropertyId = searchParams.get('propertyId') || ''

  const [formData, setFormData] = useState<JobFormData>({
    customerId: preSelectedCustomerId,
    propertyId: preSelectedPropertyId,
    serviceTypeId: '',
    title: '',
    description: '',
    priority: 'NORMAL',
    jobType: 'SERVICE',
    tradeType: 'HVAC',
    scheduledStart: '',
    timeWindowStart: '08:00',
    timeWindowEnd: '12:00',
    estimatedDuration: 60,
  })

  // Fetch customers for dropdown
  const { data: customers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await fetch('/api/customers?pageSize=100')
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data = await res.json()
      return data.data || []
    },
  })

  // Fetch service types
  const { data: serviceTypes } = useQuery({
    queryKey: ['service-types'],
    queryFn: async () => {
      const res = await fetch('/api/service-types')
      if (!res.ok) throw new Error('Failed to fetch service types')
      return res.json()
    },
  })

  // Fetch properties for selected customer
  const { data: properties } = useQuery({
    queryKey: ['customer-properties', formData.customerId],
    queryFn: async () => {
      if (!formData.customerId) return []
      const res = await fetch(`/api/customers/${formData.customerId}`)
      if (!res.ok) throw new Error('Failed to fetch customer')
      const customer = await res.json()
      return customer.properties || []
    },
    enabled: !!formData.customerId,
  })

  // Auto-select first property when customer changes (only if not preselected)
  useEffect(() => {
    if (properties && properties.length > 0 && !formData.propertyId && !preSelectedPropertyId) {
      setFormData(prev => ({ ...prev, propertyId: properties[0].id }))
    }
  }, [properties, formData.propertyId, preSelectedPropertyId])

  const createMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          scheduledStart: data.scheduledStart ? new Date(data.scheduledStart).toISOString() : null,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create job')
      }
      return res.json()
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      router.push(`/dashboard/jobs/${job.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value
    setFormData({ ...formData, [e.target.name]: value })

    // Reset property when customer changes
    if (e.target.name === 'customerId') {
      setFormData(prev => ({ ...prev, customerId: e.target.value, propertyId: '' }))
    }
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
        <Link href="/dashboard/jobs" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Property */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Customer & Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Customer *</label>
              <select
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                required
                className="input"
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
              <label className="label">Property *</label>
              <select
                name="propertyId"
                value={formData.propertyId}
                onChange={handleChange}
                required
                disabled={!formData.customerId}
                className="input"
              >
                <option value="">Select property...</option>
                {properties?.map((property: { id: string; address: string; city: string }) => (
                  <option key={property.id} value={property.id}>
                    {property.address}, {property.city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Job Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., AC Not Cooling, Heater Maintenance"
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Detailed description of the issue or work required..."
                className="input"
              />
            </div>
            <div>
              <label className="label">Service Type</label>
              <select
                name="serviceTypeId"
                value={formData.serviceTypeId}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select service...</option>
                {serviceTypes?.map((st: { id: string; name: string; category: string }) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Trade Type *</label>
              <select
                name="tradeType"
                value={formData.tradeType}
                onChange={handleChange}
                required
                className="input"
              >
                <option value="HVAC">HVAC</option>
                <option value="PLUMBING">Plumbing</option>
                <option value="ELECTRICAL">Electrical</option>
              </select>
            </div>
            <div>
              <label className="label">Job Type</label>
              <select
                name="jobType"
                value={formData.jobType}
                onChange={handleChange}
                className="input"
              >
                <option value="SERVICE">Service Call</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="INSTALLATION">Installation</option>
                <option value="REPAIR">Repair</option>
                <option value="INSPECTION">Inspection</option>
                <option value="WARRANTY">Warranty</option>
                <option value="CALLBACK">Callback</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Scheduled Date</label>
              <input
                type="datetime-local"
                name="scheduledStart"
                value={formData.scheduledStart}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Time Window Start</label>
              <input
                type="time"
                name="timeWindowStart"
                value={formData.timeWindowStart}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Time Window End</label>
              <input
                type="time"
                name="timeWindowEnd"
                value={formData.timeWindowEnd}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Estimated Duration (min)</label>
              <input
                type="number"
                name="estimatedDuration"
                value={formData.estimatedDuration}
                onChange={handleChange}
                min={15}
                step={15}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/jobs" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Job'}
          </button>
        </div>

        {createMutation.isError && (
          <p className="text-red-600 text-sm">{createMutation.error.message}</p>
        )}
      </form>
    </div>
  )
}

export default function NewJobPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <NewJobForm />
    </Suspense>
  )
}
