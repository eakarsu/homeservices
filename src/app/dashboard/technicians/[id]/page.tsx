'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  CheckBadgeIcon,
  CalendarDaysIcon,
  ClockIcon,
  StarIcon,
  MapPinIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface TechnicianDetail {
  id: string
  employeeId: string | null
  color: string | null
  tradeTypes: string[]
  certifications: string[]
  payType: string
  hourlyRate: number | null
  status: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
  }
  truck: {
    id: string
    name: string
    vehicleId: string | null
    make: string | null
    model: string | null
    year: number | null
  } | null
  stats: {
    completedJobs: number
    avgRating: number
    totalReviews: number
    avgJobDuration: number
    revenueGenerated: number
  }
  recentJobs: {
    id: string
    jobNumber: string
    title: string
    status: string
    scheduledStart: string | null
    customer: {
      firstName: string
      lastName: string
    }
  }[]
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  ON_JOB: 'bg-blue-100 text-blue-800',
  EN_ROUTE: 'bg-yellow-100 text-yellow-800',
  BREAK: 'bg-orange-100 text-orange-800',
  OFF_DUTY: 'bg-gray-100 text-gray-800',
}

export default function TechnicianDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const { data: technician, isLoading } = useQuery<TechnicianDetail>({
    queryKey: ['technician', id],
    queryFn: async () => {
      const res = await fetch(`/api/technicians/${id}`)
      if (!res.ok) throw new Error('Failed to fetch technician')
      return res.json()
    }
  })

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/technicians/${id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      toast.success(`Message sent to ${technician?.user.firstName}`)
      setShowMessageModal(false)
      setMessage('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!technician) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Technician not found</p>
        <Link href="/dashboard/technicians" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to Technicians
        </Link>
      </div>
    )
  }

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
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: technician.color || '#6366f1' }}
            >
              {technician.user.firstName[0]}{technician.user.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {technician.user.firstName} {technician.user.lastName}
              </h1>
              <p className="text-gray-500">
                {technician.employeeId ? `Employee #${technician.employeeId}` : 'Field Technician'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            statusColors[technician.status] || 'bg-gray-100 text-gray-800'
          )}>
            {technician.status.replace('_', ' ')}
          </span>
          <button
            onClick={() => router.push(`/dashboard/dispatch?technicianId=${id}`)}
            className="btn-primary"
          >
            Assign Job
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Stats */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{technician.stats.completedJobs}</p>
                <p className="text-sm text-blue-700">Jobs Completed</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-center gap-1">
                  <StarIcon className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  <span className="text-3xl font-bold text-yellow-600">{technician.stats.avgRating.toFixed(1)}</span>
                </div>
                <p className="text-sm text-yellow-700">{technician.stats.totalReviews} Reviews</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{technician.stats.avgJobDuration}</p>
                <p className="text-sm text-green-700">Avg Minutes</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">
                  ${(technician.stats.revenueGenerated / 1000).toFixed(0)}k
                </p>
                <p className="text-sm text-purple-700">Revenue</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-600">
                  ${technician.hourlyRate ? Number(technician.hourlyRate).toFixed(0) : '0'}
                </p>
                <p className="text-sm text-gray-500">{technician.payType}</p>
              </div>
            </div>
          </div>

          {/* Skills & Certifications */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills & Certifications</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Trade Types</h3>
                <div className="flex flex-wrap gap-2">
                  {technician.tradeTypes.map((trade) => (
                    <span
                      key={trade}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      <WrenchScrewdriverIcon className="w-4 h-4" />
                      {trade}
                    </span>
                  ))}
                </div>
              </div>

              {technician.certifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {technician.certifications.map((cert) => (
                      <span
                        key={cert}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium"
                      >
                        <CheckBadgeIcon className="w-4 h-4" />
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Jobs */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
              <Link href={`/dashboard/jobs?technician=${id}`} className="text-sm text-primary-600 hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {technician.recentJobs.length > 0 ? (
                technician.recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/dashboard/jobs/${job.id}`}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-500">
                          {job.customer.firstName} {job.customer.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          job.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        )}>
                          {job.status}
                        </span>
                        {job.scheduledStart && (
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(job.scheduledStart), 'MMM d, h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent jobs</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <UserCircleIcon className="w-5 h-5 text-gray-400" />
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                <a href={`mailto:${technician.user.email}`} className="text-primary-600 hover:underline">
                  {technician.user.email}
                </a>
              </div>
              {technician.user.phone && (
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${technician.user.phone}`} className="text-primary-600 hover:underline">
                    {technician.user.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Vehicle */}
          {technician.truck && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TruckIcon className="w-5 h-5 text-gray-400" />
                Assigned Vehicle
              </h3>
              <Link
                href={`/dashboard/inventory/trucks?id=${technician.truck.id}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <p className="font-medium text-gray-900">{technician.truck.name}</p>
                <p className="text-sm text-gray-500">
                  {technician.truck.year} {technician.truck.make} {technician.truck.model}
                </p>
                {technician.truck.vehicleId && (
                  <p className="text-xs text-gray-400 mt-1">ID: {technician.truck.vehicleId}</p>
                )}
              </Link>
            </div>
          )}

          {/* Schedule */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
              Today's Schedule
            </h3>
            <div className="text-center py-4">
              <ClockIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">View schedule to see assignments</p>
              <Link href="/dashboard/schedule" className="text-sm text-primary-600 hover:underline">
                Open Schedule
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/dashboard/dispatch/map?technicianId=${id}`)}
                className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
              >
                <MapPinIcon className="w-4 h-4" />
                View Location
              </button>
              <button
                onClick={() => {
                  if (technician.user.phone) {
                    setShowMessageModal(true)
                  } else {
                    toast.error('No phone number available')
                  }
                }}
                className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                Send Message to {technician.user.firstName}
              </h3>
              <button
                onClick={() => {
                  setShowMessageModal(false)
                  setMessage('')
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your message..."
              />
              <p className="text-xs text-gray-500 mt-2">
                This message will be sent via SMS to {technician.user.phone}
              </p>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => {
                  setShowMessageModal(false)
                  setMessage('')
                }}
                className="btn-secondary"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
                className="btn-primary flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
