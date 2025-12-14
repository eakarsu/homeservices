'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  TruckIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'
import { getStatusColor, getTradeColor } from '@/lib/utils'

interface Technician {
  id: string
  status: string
  currentLat?: number
  currentLng?: number
  color?: string
  user: {
    firstName: string
    lastName: string
    phone?: string
  }
  truck?: {
    name: string
  }
}

interface Job {
  id: string
  jobNumber: string
  title: string
  status: string
  priority: string
  tradeType: string
  timeWindowStart?: string
  timeWindowEnd?: string
  customer: {
    firstName?: string
    lastName?: string
  }
  property?: {
    address: string
    city: string
    state: string
    zip: string
  }
  assignments: Array<{
    technician: {
      id: string
    }
  }>
}

export default function DispatchMapPage() {
  const [selectedTech, setSelectedTech] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)

  const { data: technicians } = useQuery<Technician[]>({
    queryKey: ['technicians-map'],
    queryFn: async () => {
      const res = await fetch('/api/technicians')
      if (!res.ok) throw new Error('Failed to fetch technicians')
      return res.json()
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const { data: jobs } = useQuery<Job[]>({
    queryKey: ['dispatch-jobs-map'],
    queryFn: async () => {
      const res = await fetch('/api/dispatch/board')
      if (!res.ok) throw new Error('Failed to fetch jobs')
      const data = await res.json()
      return data.jobs || []
    },
  })

  const activeTechs = technicians?.filter(t => t.status !== 'OFF_DUTY') || []
  const activeJobs = jobs?.filter(j => !['COMPLETED', 'CANCELLED'].includes(j.status)) || []

  const getCustomerName = (job: Job) => {
    return `${job.customer?.firstName || ''} ${job.customer?.lastName || ''}`.trim() || 'Unknown'
  }

  const getJobsForTech = (techId: string) => {
    return activeJobs.filter(j => j.assignments.some(a => a.technician.id === techId))
  }

  const unassignedJobs = activeJobs.filter(j => j.assignments.length === 0)

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/dispatch" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Dispatch Map</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live updates
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
        {/* Map Area */}
        <div className="lg:col-span-3 card overflow-hidden">
          <div className="h-full bg-gray-100 flex items-center justify-center relative">
            {/* Placeholder for actual map - would integrate Google Maps */}
            <div className="text-center">
              <MapPinIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Map View</p>
              <p className="text-sm text-gray-400">
                Integrate Google Maps API to show technician locations and job sites
              </p>
              <p className="text-xs text-gray-400 mt-4">
                Set GOOGLE_MAPS_API_KEY in .env to enable
              </p>
            </div>

            {/* Mock technician markers */}
            <div className="absolute top-4 left-4 space-y-2">
              {activeTechs.slice(0, 3).map((tech, i) => (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTech(tech.id)}
                  className={`flex items-center gap-2 bg-white rounded-lg p-2 shadow cursor-pointer hover:shadow-md transition-shadow ${
                    selectedTech === tech.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  style={{ marginTop: i * 60 }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: tech.color || '#3B82F6' }}
                  >
                    {tech.user.firstName[0]}{tech.user.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tech.user.firstName}</p>
                    <p className="text-xs text-gray-500">{tech.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 overflow-y-auto">
          {/* Technicians */}
          <div className="card">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <TruckIcon className="w-5 h-5" />
              Technicians ({activeTechs.length})
            </h2>
            <div className="space-y-2">
              {activeTechs.map((tech) => (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTech(selectedTech === tech.id ? null : tech.id)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedTech === tech.id ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: tech.color || '#3B82F6' }}
                    >
                      {tech.user.firstName[0]}{tech.user.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {tech.user.firstName} {tech.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{tech.truck?.name || 'No truck'}</p>
                    </div>
                    <span className={`badge text-xs ${getStatusColor(tech.status)}`}>
                      {tech.status.replace('_', ' ')}
                    </span>
                  </div>
                  {selectedTech === tech.id && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-gray-500 mb-1">Assigned Jobs:</p>
                      {getJobsForTech(tech.id).map((job) => (
                        <Link
                          key={job.id}
                          href={`/dashboard/jobs/${job.id}`}
                          className="block text-xs p-1 hover:bg-gray-100 rounded"
                        >
                          {job.jobNumber} - {job.title}
                        </Link>
                      ))}
                      {getJobsForTech(tech.id).length === 0 && (
                        <p className="text-xs text-gray-400">No jobs assigned</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Unassigned Jobs */}
          <div className="card">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <WrenchScrewdriverIcon className="w-5 h-5" />
              Unassigned ({unassignedJobs.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {unassignedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="block p-2 rounded-lg hover:bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{job.jobNumber}</span>
                    <span className={`badge text-xs ${getTradeColor(job.tradeType)}`}>
                      {job.tradeType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{job.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {job.property?.city || 'No location'}
                  </p>
                </Link>
              ))}
              {unassignedJobs.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">All jobs assigned</p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h2 className="font-semibold mb-3">Today's Stats</h2>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-lg font-bold text-blue-600">{activeJobs.length}</p>
                <p className="text-xs text-gray-500">Active Jobs</p>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <p className="text-lg font-bold text-green-600">
                  {activeTechs.filter(t => t.status === 'AVAILABLE').length}
                </p>
                <p className="text-xs text-gray-500">Available</p>
              </div>
              <div className="p-2 bg-orange-50 rounded">
                <p className="text-lg font-bold text-orange-600">
                  {activeTechs.filter(t => t.status === 'ON_JOB').length}
                </p>
                <p className="text-xs text-gray-500">On Job</p>
              </div>
              <div className="p-2 bg-purple-50 rounded">
                <p className="text-lg font-bold text-purple-600">
                  {activeTechs.filter(t => t.status === 'EN_ROUTE').length}
                </p>
                <p className="text-xs text-gray-500">En Route</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
