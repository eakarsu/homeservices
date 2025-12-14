'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const TRADE_TYPES = ['HVAC', 'PLUMBING', 'ELECTRICAL', 'GENERAL']
const PAY_TYPES = ['HOURLY', 'SALARY', 'COMMISSION']
const COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
]

interface Truck {
  id: string
  name: string
  vehicleId?: string
}

export default function NewTechnicianPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    employeeId: '',
    color: '#3B82F6',
    tradeTypes: [] as string[],
    certifications: '',
    payType: 'HOURLY',
    hourlyRate: '',
    truckId: '',
  })

  const { data: trucks } = useQuery<Truck[]>({
    queryKey: ['trucks'],
    queryFn: async () => {
      const res = await fetch('/api/trucks')
      if (!res.ok) throw new Error('Failed to fetch trucks')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          certifications: formData.certifications
            ? formData.certifications.split(',').map(c => c.trim())
            : [],
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
          truckId: formData.truckId || undefined,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create technician')
      }
      return res.json()
    },
    onSuccess: (technician) => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] })
      router.push(`/dashboard/technicians/${technician.id}`)
    },
  })

  const toggleTradeType = (trade: string) => {
    setFormData(prev => ({
      ...prev,
      tradeTypes: prev.tradeTypes.includes(trade)
        ? prev.tradeTypes.filter(t => t !== trade)
        : [...prev.tradeTypes, trade],
    }))
  }

  const isValid = formData.firstName && formData.lastName && formData.email && formData.tradeTypes.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/technicians" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Technician</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="label">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="label">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="label">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="label">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  placeholder="Leave blank for temp password"
                />
                <p className="text-xs text-gray-500 mt-1">Default: TempPass123!</p>
              </div>
              <div>
                <label className="label">Employee ID</label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="input"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Skills & Certifications */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Skills & Certifications</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Trade Types *</label>
                <div className="flex flex-wrap gap-2">
                  {TRADE_TYPES.map((trade) => (
                    <button
                      key={trade}
                      type="button"
                      onClick={() => toggleTradeType(trade)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        formData.tradeTypes.includes(trade)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {trade}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Certifications</label>
                <input
                  type="text"
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  className="input"
                  placeholder="EPA 608, NATE, etc. (comma separated)"
                />
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Compensation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Pay Type</label>
                <select
                  value={formData.payType}
                  onChange={(e) => setFormData({ ...formData, payType: e.target.value })}
                  className="input"
                >
                  {PAY_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              {formData.payType === 'HOURLY' && (
                <div>
                  <label className="label">Hourly Rate</label>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    className="input"
                    step="0.01"
                    min="0"
                    placeholder="$0.00"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Assignment */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Assignment</h2>
            <div>
              <label className="label">Assign Truck</label>
              <select
                value={formData.truckId}
                onChange={(e) => setFormData({ ...formData, truckId: e.target.value })}
                className="input"
              >
                <option value="">No truck assigned</option>
                {trucks?.map((truck) => (
                  <option key={truck.id} value={truck.id}>
                    {truck.name} {truck.vehicleId ? `(${truck.vehicleId})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Calendar Color */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Calendar Color</h2>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-10 h-10 rounded-lg border-2 ${
                    formData.color === color.value ? 'border-gray-900' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!isValid || createMutation.isPending}
              className="btn-primary w-full"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Technician'}
            </button>
            <Link href="/dashboard/technicians" className="btn-secondary w-full text-center">
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
