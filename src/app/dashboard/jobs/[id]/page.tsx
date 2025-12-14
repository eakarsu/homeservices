'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PencilIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { formatDateTime, getStatusColor, getPriorityColor } from '@/lib/utils'

interface Job {
  id: string
  jobNumber: string
  title: string
  description?: string
  status: string
  priority: string
  jobType: string
  tradeType: string
  scheduledStart?: string
  scheduledEnd?: string
  timeWindowStart?: string
  timeWindowEnd?: string
  estimatedDuration?: number
  actualDuration?: number
  address?: string
  createdAt: string
  customer: {
    id: string
    firstName?: string
    lastName?: string
    companyName?: string
    phone?: string
    email?: string
  }
  property?: {
    id: string
    name?: string
    address: string
    city: string
    state: string
    zip: string
  }
  serviceType?: {
    id: string
    name: string
    tradeType: string
  }
  assignments: Array<{
    id: string
    isPrimary: boolean
    technician: {
      id: string
      user: {
        firstName: string
        lastName: string
      }
    }
  }>
  notes?: string
}

export default function JobDetailPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const jobId = params.id as string

  const { data: job, isLoading } = useQuery<Job>({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`)
      if (!res.ok) throw new Error('Failed to fetch job')
      return res.json()
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
    },
  })

  const getCustomerName = () => {
    const personalName = `${job?.customer?.firstName || ''} ${job?.customer?.lastName || ''}`.trim()
    if (personalName && job?.customer?.companyName) {
      return `${personalName} (${job.customer.companyName})`
    }
    return personalName || job?.customer?.companyName || 'Unknown'
  }

  const getFullAddress = () => {
    if (job?.property) {
      return `${job.property.address}, ${job.property.city}, ${job.property.state} ${job.property.zip}`
    }
    return job?.address || 'No address'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Job not found</p>
        <Link href="/dashboard/jobs" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to jobs
        </Link>
      </div>
    )
  }

  const statusActions = {
    PENDING: ['SCHEDULED', 'CANCELLED'],
    SCHEDULED: ['DISPATCHED', 'CANCELLED'],
    DISPATCHED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'ON_HOLD'],
    ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  }

  const nextStatuses = statusActions[job.status as keyof typeof statusActions] || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/jobs" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{job.jobNumber}</h1>
              <span className={`badge ${getStatusColor(job.status)}`}>
                {job.status.replace('_', ' ')}
              </span>
              <span className={`badge ${getPriorityColor(job.priority)}`}>
                {job.priority}
              </span>
            </div>
            <p className="text-gray-600">{job.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {nextStatuses.map((status) => (
            <button
              key={status}
              onClick={() => updateStatusMutation.mutate(status)}
              disabled={updateStatusMutation.isPending}
              className={`btn-secondary flex items-center gap-2 ${
                status === 'COMPLETED' ? 'bg-green-50 text-green-700 hover:bg-green-100' :
                status === 'CANCELLED' ? 'bg-red-50 text-red-700 hover:bg-red-100' :
                status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : ''
              }`}
            >
              {status === 'COMPLETED' && <CheckCircleIcon className="w-4 h-4" />}
              {status === 'CANCELLED' && <XCircleIcon className="w-4 h-4" />}
              {status === 'IN_PROGRESS' && <PlayIcon className="w-4 h-4" />}
              {status.replace('_', ' ')}
            </button>
          ))}
          <Link href={`/dashboard/jobs/${jobId}/edit`} className="btn-secondary flex items-center gap-2">
            <PencilIcon className="w-4 h-4" />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {job.description && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {/* Notes */}
          {job.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ChatBubbleLeftIcon className="w-5 h-5" />
                Notes
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">{job.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Customer</h2>
            <Link href={`/dashboard/customers/${job.customer.id}`} className="block hover:bg-gray-50 -mx-2 px-2 py-2 rounded">
              <p className="font-medium text-primary-600">{getCustomerName()}</p>
              {job.customer.phone && (
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  <PhoneIcon className="w-4 h-4" />
                  {job.customer.phone}
                </p>
              )}
            </Link>
          </div>

          {/* Location */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Location</h2>
            <p className="text-gray-700 flex items-start gap-2">
              <MapPinIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              {getFullAddress()}
            </p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(getFullAddress())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 text-sm hover:underline mt-2 inline-block"
            >
              Open in Maps
            </a>
          </div>

          {/* Schedule */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Schedule</h2>
            <div className="space-y-2">
              {job.scheduledStart && (
                <p className="text-sm flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Start:</span>
                  {formatDateTime(job.scheduledStart)}
                </p>
              )}
              {job.timeWindowStart && job.timeWindowEnd && (
                <p className="text-sm flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Window:</span>
                  {job.timeWindowStart} - {job.timeWindowEnd}
                </p>
              )}
              {job.estimatedDuration && (
                <p className="text-sm text-gray-600">
                  Est. Duration: {job.estimatedDuration} min
                </p>
              )}
              {job.actualDuration && (
                <p className="text-sm text-gray-600">
                  Actual Duration: {job.actualDuration} min
                </p>
              )}
            </div>
          </div>

          {/* Assigned Technicians */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Assigned
              </h2>
              <Link href={`/dispatch?jobId=${jobId}`} className="text-primary-600 text-sm hover:underline">
                Manage
              </Link>
            </div>
            <div className="space-y-2">
              {job.assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {assignment.technician.user.firstName[0]}{assignment.technician.user.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {assignment.technician.user.firstName} {assignment.technician.user.lastName}
                    </p>
                    {assignment.isPrimary && (
                      <span className="text-xs text-primary-600">Primary</span>
                    )}
                  </div>
                </div>
              ))}
              {job.assignments.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-2">Not assigned</p>
              )}
            </div>
          </div>

          {/* Service Type */}
          {job.serviceType && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <WrenchScrewdriverIcon className="w-5 h-5" />
                Service
              </h2>
              <p className="font-medium">{job.serviceType.name}</p>
              <p className="text-sm text-gray-500">Trade: {job.serviceType.tradeType || job.tradeType}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
