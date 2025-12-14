'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  PlayIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { formatDateTime, getStatusColor, getPriorityColor } from '@/lib/utils'

interface Job {
  id: string
  jobNumber: string
  title: string
  status: string
  priority: string
  tradeType: string
  scheduledStart?: string
  timeWindowStart?: string
  timeWindowEnd?: string
  estimatedDuration?: number
  customer: {
    firstName?: string
    lastName?: string
    phone?: string
  }
  property?: {
    address: string
    city: string
    state: string
    zip: string
  }
}

export default function TechnicianHomePage() {
  const { data: session } = useSession()

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['tech-jobs-today'],
    queryFn: async () => {
      const res = await fetch('/api/technicians/my-jobs')
      if (!res.ok) throw new Error('Failed to fetch jobs')
      return res.json()
    },
  })

  const todayJobs = jobs || []
  const activeJob = todayJobs.find(j => j.status === 'IN_PROGRESS')
  const upcomingJobs = todayJobs.filter(j => !['COMPLETED', 'CANCELLED', 'IN_PROGRESS'].includes(j.status))
  const completedJobs = todayJobs.filter(j => j.status === 'COMPLETED')

  const getCustomerName = (job: Job) => {
    return `${job.customer?.firstName || ''} ${job.customer?.lastName || ''}`.trim() || 'Unknown'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Hi, {session?.user?.name?.split(' ')[0] || 'Tech'}!
          </h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary-600">{todayJobs.length}</p>
          <p className="text-xs text-gray-500">Jobs Today</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Active Job */}
          {activeJob && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <PlayIcon className="w-5 h-5 text-primary-600" />
                <span className="font-semibold text-primary-700">Current Job</span>
              </div>
              <Link href={`/tech/job/${activeJob.id}`} className="block">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{activeJob.jobNumber}</p>
                      <p className="text-sm text-gray-600">{activeJob.title}</p>
                    </div>
                    <span className={`badge ${getPriorityColor(activeJob.priority)}`}>
                      {activeJob.priority}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4" />
                      {activeJob.property?.address}, {activeJob.property?.city}
                    </p>
                    <p>{getCustomerName(activeJob)}</p>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Upcoming Jobs */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ClockIcon className="w-5 h-5" />
              Upcoming ({upcomingJobs.length})
            </h2>
            <div className="space-y-3">
              {upcomingJobs.length > 0 ? (
                upcomingJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/tech/job/${job.id}`}
                    className="block bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-primary-200 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{job.jobNumber}</p>
                        <p className="text-sm text-gray-600 line-clamp-1">{job.title}</p>
                      </div>
                      <span className={`badge ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {job.timeWindowStart && job.timeWindowEnd && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {job.timeWindowStart} - {job.timeWindowEnd}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        {job.property?.city || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm">{getCustomerName(job)}</span>
                      {job.customer?.phone && (
                        <a
                          href={`tel:${job.customer.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-green-50 text-green-600 rounded-full"
                        >
                          <PhoneIcon className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No upcoming jobs</p>
              )}
            </div>
          </div>

          {/* Completed Jobs */}
          {completedJobs.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                Completed ({completedJobs.length})
              </h2>
              <div className="space-y-2">
                {completedJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/tech/job/${job.id}`}
                    className="flex items-center justify-between bg-green-50 rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{job.jobNumber}</p>
                      <p className="text-sm text-gray-600">{job.title}</p>
                    </div>
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
