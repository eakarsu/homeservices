'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import {
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  PlayIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import { getStatusColor, getPriorityColor } from '@/lib/utils'

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

type FilterStatus = 'all' | 'active' | 'completed' | 'scheduled'

export default function TechnicianJobsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['tech-all-jobs'],
    queryFn: async () => {
      const res = await fetch('/api/technicians/my-jobs?all=true')
      if (!res.ok) throw new Error('Failed to fetch jobs')
      return res.json()
    },
  })

  const allJobs = jobs || []

  // Filter jobs based on search and status
  const filteredJobs = allJobs.filter(job => {
    // Search filter
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = !searchQuery ||
      job.jobNumber.toLowerCase().includes(searchLower) ||
      job.title.toLowerCase().includes(searchLower) ||
      job.customer?.firstName?.toLowerCase().includes(searchLower) ||
      job.customer?.lastName?.toLowerCase().includes(searchLower) ||
      job.property?.address?.toLowerCase().includes(searchLower) ||
      job.property?.city?.toLowerCase().includes(searchLower)

    // Status filter
    let matchesStatus = true
    if (filterStatus === 'active') {
      matchesStatus = job.status === 'IN_PROGRESS'
    } else if (filterStatus === 'completed') {
      matchesStatus = job.status === 'COMPLETED'
    } else if (filterStatus === 'scheduled') {
      matchesStatus = ['SCHEDULED', 'DISPATCHED'].includes(job.status)
    }

    return matchesSearch && matchesStatus
  })

  const getCustomerName = (job: Job) => {
    return `${job.customer?.firstName || ''} ${job.customer?.lastName || ''}`.trim() || 'Unknown'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <PlayIcon className="w-4 h-4 text-blue-600" />
      case 'COMPLETED':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />
      default:
        return <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
    }
  }

  const statusCounts = {
    all: allJobs.length,
    active: allJobs.filter(j => j.status === 'IN_PROGRESS').length,
    completed: allJobs.filter(j => j.status === 'COMPLETED').length,
    scheduled: allJobs.filter(j => ['SCHEDULED', 'DISPATCHED'].includes(j.status)).length,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Jobs</h1>
        <p className="text-sm text-gray-500">All assigned jobs</p>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search jobs, customers, addresses..."
          className="input pl-10 w-full"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filterStatus === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({statusCounts.all})
        </button>
        <button
          onClick={() => setFilterStatus('scheduled')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filterStatus === 'scheduled'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Scheduled ({statusCounts.scheduled})
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filterStatus === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          Active ({statusCounts.active})
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filterStatus === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          Completed ({statusCounts.completed})
        </button>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <Link
              key={job.id}
              href={`/tech/job/${job.id}`}
              className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-primary-200 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-2">
                  {getStatusIcon(job.status)}
                  <div>
                    <p className="font-semibold text-gray-900">{job.jobNumber}</p>
                    <p className="text-sm text-gray-600 line-clamp-1">{job.title}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`badge text-xs ${getStatusColor(job.status)}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                  <span className={`badge text-xs ${getPriorityColor(job.priority)}`}>
                    {job.priority}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 mt-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {job.property ? `${job.property.address}, ${job.property.city}` : 'No address'}
                  </span>
                </div>

                {job.timeWindowStart && job.timeWindowEnd && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ClockIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{job.timeWindowStart} - {job.timeWindowEnd}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                  <span className="text-sm font-medium text-gray-700">{getCustomerName(job)}</span>
                  {job.customer?.phone && (
                    <a
                      href={`tel:${job.customer.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                    >
                      <PhoneIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FunnelIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No jobs found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery ? 'Try a different search term' : 'No jobs match this filter'}
          </p>
        </div>
      )}
    </div>
  )
}
