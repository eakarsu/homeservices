'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  SparklesIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BeakerIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { format, addDays } from 'date-fns'

interface ScheduleSuggestion {
  date: string
  timeSlot: string
  technicianId: string
  technicianName: string
  score: number
  reasons: string[]
  travelTime: number
  conflicts: string[]
}

interface SchedulingResult {
  suggestions: ScheduleSuggestion[]
  bestOption: number
  customerPreferenceMatch: number
  warnings: string[]
}

interface Customer {
  id: string
  name: string
  address: string
  preferredTimes: string[]
}

interface ServiceType {
  id: string
  name: string
  estimatedDuration: number
  tradeType: string
}

// Sample data for demonstration
const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: 'sample-cust-1',
    name: 'Johnson Residence',
    address: '1234 Palm Dr, Phoenix, AZ 85001',
    preferredTimes: ['morning']
  },
  {
    id: 'sample-cust-2',
    name: 'Smith Commercial',
    address: '5678 Central Ave, Phoenix, AZ 85004',
    preferredTimes: ['afternoon']
  },
  {
    id: 'sample-cust-3',
    name: 'Williams Home',
    address: '9012 Camelback Rd, Phoenix, AZ 85016',
    preferredTimes: ['morning', 'afternoon']
  }
]

const SAMPLE_SERVICE_TYPES: ServiceType[] = [
  {
    id: 'sample-svc-1',
    name: 'AC Repair',
    estimatedDuration: 90,
    tradeType: 'HVAC'
  },
  {
    id: 'sample-svc-2',
    name: 'Annual Maintenance',
    estimatedDuration: 60,
    tradeType: 'HVAC'
  },
  {
    id: 'sample-svc-3',
    name: 'Thermostat Installation',
    estimatedDuration: 45,
    tradeType: 'HVAC'
  },
  {
    id: 'sample-svc-4',
    name: 'Duct Cleaning',
    estimatedDuration: 120,
    tradeType: 'HVAC'
  }
]

const SAMPLE_RESULT: SchedulingResult = {
  suggestions: [
    {
      date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      timeSlot: '9:00 AM - 11:00 AM',
      technicianId: 'tech-1',
      technicianName: 'Mike Johnson',
      score: 95,
      reasons: ['Matches preferred time', 'Closest technician', 'Skills match', 'Light workload'],
      travelTime: 12,
      conflicts: []
    },
    {
      date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      timeSlot: '2:00 PM - 4:00 PM',
      technicianId: 'tech-2',
      technicianName: 'Sarah Williams',
      score: 88,
      reasons: ['Available slot', 'Highly rated technician', 'Same area'],
      travelTime: 18,
      conflicts: []
    },
    {
      date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
      timeSlot: '10:00 AM - 12:00 PM',
      technicianId: 'tech-1',
      technicianName: 'Mike Johnson',
      score: 82,
      reasons: ['Morning slot', 'Skills match', 'Day after preferred'],
      travelTime: 12,
      conflicts: ['Slight schedule overlap with previous job']
    },
    {
      date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
      timeSlot: '3:00 PM - 5:00 PM',
      technicianId: 'tech-3',
      technicianName: 'David Chen',
      score: 75,
      reasons: ['Available slot', 'Skills match'],
      travelTime: 25,
      conflicts: []
    }
  ],
  bestOption: 0,
  customerPreferenceMatch: 92,
  warnings: []
}

export default function SmartSchedulingPage() {
  const router = useRouter()
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [preferredDate, setPreferredDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'))
  const [preferredTime, setPreferredTime] = useState('morning')
  const [urgency, setUrgency] = useState('normal')
  const [notes, setNotes] = useState('')
  const [sampleMode, setSampleMode] = useState(false)
  const [sampleResult, setSampleResult] = useState<SchedulingResult | null>(null)

  const loadSampleData = () => {
    setSampleMode(true)
    setSelectedCustomer('sample-cust-1')
    setSelectedService('sample-svc-1')
    setPreferredTime('morning')
    setUrgency('normal')
    setNotes('Customer prefers early morning appointments. Gate code: 1234.')
    setSampleResult(null) // Don't show results - user must click button to call OpenRouter
  }

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await fetch('/api/customers?limit=100')
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data = await res.json()
      return data.customers?.map((c: { id: string; firstName?: string; lastName?: string; companyName?: string; properties?: { address: string }[] }) => ({
        id: c.id,
        name: c.firstName ? `${c.firstName} ${c.lastName}` : c.companyName,
        address: c.properties?.[0]?.address || 'No address',
        preferredTimes: ['morning', 'afternoon']
      })) || []
    },
    enabled: !sampleMode
  })

  const { data: serviceTypes = [] } = useQuery<ServiceType[]>({
    queryKey: ['service-types'],
    queryFn: async () => {
      const res = await fetch('/api/service-types')
      if (!res.ok) throw new Error('Failed to fetch service types')
      return res.json()
    },
    enabled: !sampleMode
  })

  // Use sample data when in sample mode
  const displayCustomers = sampleMode ? SAMPLE_CUSTOMERS : customers
  const displayServiceTypes = sampleMode ? SAMPLE_SERVICE_TYPES : serviceTypes

  const schedulingMutation = useMutation({
    mutationFn: async () => {
      setSampleResult(null)

      // If in sample mode, send sample data to OpenRouter for real AI analysis
      if (sampleMode) {
        const selectedCustomerData = SAMPLE_CUSTOMERS.find(c => c.id === selectedCustomer)
        const selectedServiceData = SAMPLE_SERVICE_TYPES.find(s => s.id === selectedService)

        const res = await fetch('/api/ai/smart-scheduling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            useSampleData: true,
            customerData: selectedCustomerData,
            serviceData: selectedServiceData,
            preferredDate,
            preferredTime,
            urgency,
            notes
          })
        })
        if (!res.ok) throw new Error('Failed to get scheduling suggestions')
        return res.json() as Promise<SchedulingResult>
      }

      // Normal mode
      const res = await fetch('/api/ai/smart-scheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer,
          serviceTypeId: selectedService,
          preferredDate,
          preferredTime,
          urgency,
          notes
        })
      })
      if (!res.ok) throw new Error('Failed to get scheduling suggestions')
      return res.json() as Promise<SchedulingResult>
    }
  })

  const result = sampleResult || schedulingMutation.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/dashboard/ai')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to AI Features"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="w-7 h-7 text-primary-600" />
              Smart Scheduling
            </h1>
            <p className="text-gray-500">
              AI-powered appointment scheduling considering travel time, technician availability, and customer preferences
            </p>
          </div>
        </div>
        <button
          onClick={loadSampleData}
          className="btn-secondary flex items-center gap-2"
        >
          <BeakerIcon className="w-5 h-5" />
          Load Sample Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-gray-400" />
              Customer
            </h2>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="input"
            >
              <option value="">Select a customer...</option>
              {displayCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.address}
                </option>
              ))}
            </select>
          </div>

          {/* Service Type */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
              Service Type
            </h2>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="input"
            >
              <option value="">Select a service...</option>
              {displayServiceTypes.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.estimatedDuration} min)
                </option>
              ))}
            </select>
          </div>

          {/* Preferences */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              Scheduling Preferences
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">Preferred Date</label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Preferred Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {['morning', 'afternoon', 'evening'].map((time) => (
                    <button
                      key={time}
                      onClick={() => setPreferredTime(time)}
                      className={cn(
                        'px-4 py-2 rounded-lg border-2 font-medium capitalize transition-colors',
                        preferredTime === time
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Morning: 8am-12pm | Afternoon: 12pm-5pm | Evening: 5pm-8pm
                </p>
              </div>

              <div>
                <label className="label">Urgency</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'low', label: 'Flexible', color: 'green' },
                    { value: 'normal', label: 'Normal', color: 'blue' },
                    { value: 'high', label: 'Urgent', color: 'red' }
                  ].map((u) => (
                    <button
                      key={u.value}
                      onClick={() => setUrgency(u.value)}
                      className={cn(
                        'px-4 py-2 rounded-lg border-2 font-medium transition-colors',
                        urgency === u.value
                          ? u.color === 'green' ? 'border-green-600 bg-green-50 text-green-700' :
                            u.color === 'blue' ? 'border-blue-600 bg-blue-50 text-blue-700' :
                            'border-red-600 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requirements or notes..."
                  rows={3}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => schedulingMutation.mutate()}
            disabled={schedulingMutation.isPending || !selectedCustomer || !selectedService}
            className="w-full btn-primary py-3 text-lg flex items-center justify-center gap-2"
          >
            {schedulingMutation.isPending ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Finding Best Times...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Find Best Appointment Slots
              </>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {!result && !schedulingMutation.isPending && (
            <div className="card text-center py-12">
              <CalendarDaysIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select customer and service
              </h3>
              <p className="text-gray-500">
                Our AI will find the optimal appointment slots based on technician availability,
                travel time, and customer preferences
              </p>
            </div>
          )}

          {schedulingMutation.isPending && (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Analyzing schedules and optimizing...</p>
            </div>
          )}

          {result && (
            <>
              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="card border-2 border-yellow-200 bg-yellow-50">
                  <h3 className="font-semibold text-yellow-800 flex items-center gap-2 mb-2">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    Notes
                  </h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {result.warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preference Match */}
              <div className="card bg-primary-50 border-primary-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-primary-900">Customer Preference Match</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {result.customerPreferenceMatch}%
                  </span>
                </div>
                <div className="w-full bg-primary-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${result.customerPreferenceMatch}%` }}
                  />
                </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Recommended Slots</h3>
                {result.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={cn(
                      'card border-2 transition-all cursor-pointer hover:shadow-md',
                      index === result.bestOption
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    )}
                  >
                    {index === result.bestOption && (
                      <div className="flex items-center gap-1 text-green-700 text-sm font-medium mb-2">
                        <CheckCircleIcon className="w-4 h-4" />
                        Best Option
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {format(new Date(suggestion.date), 'EEEE, MMM d')}
                        </p>
                        <p className="text-primary-600 font-medium">{suggestion.timeSlot}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <UserIcon className="w-4 h-4" />
                          <span>{suggestion.technicianName}</span>
                          <span className="text-gray-300">|</span>
                          <MapPinIcon className="w-4 h-4" />
                          <span>{suggestion.travelTime} min travel</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          'text-2xl font-bold',
                          suggestion.score >= 90 ? 'text-green-600' :
                          suggestion.score >= 70 ? 'text-blue-600' :
                          'text-yellow-600'
                        )}>
                          {suggestion.score}%
                        </div>
                        <p className="text-xs text-gray-500">match score</p>
                      </div>
                    </div>

                    {/* Reasons */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex flex-wrap gap-1">
                        {suggestion.reasons.map((reason, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Conflicts */}
                    {suggestion.conflicts.length > 0 && (
                      <div className="mt-2 text-xs text-orange-600">
                        Potential conflicts: {suggestion.conflicts.join(', ')}
                      </div>
                    )}

                    <button className="mt-3 w-full btn-primary text-sm">
                      Book This Slot
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
