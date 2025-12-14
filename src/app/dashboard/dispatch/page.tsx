'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  SparklesIcon,
  ArrowPathIcon,
  XMarkIcon,
  UserIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { getStatusColor, getPriorityColor, getTradeColor } from '@/lib/utils'

interface Technician {
  id: string
  user: {
    firstName: string
    lastName: string
    phone?: string
  }
  status: string
  tradeTypes: string[]
  currentLat?: number
  currentLng?: number
  assignments: {
    job: {
      id: string
      jobNumber: string
      title: string
      status: string
      priority: string
      tradeType: string
      timeWindowStart?: string
      timeWindowEnd?: string
      property?: {
        address: string
        city: string
      }
      customer: {
        firstName?: string
        lastName?: string
        phone?: string
      }
    }
  }[]
}

interface UnassignedJob {
  id: string
  jobNumber: string
  title: string
  status: string
  priority: string
  tradeType: string
  scheduledStart?: string
  timeWindowStart?: string
  timeWindowEnd?: string
  property?: {
    address: string
    city: string
  }
  customer: {
    firstName?: string
    lastName?: string
    phone?: string
  }
}

export default function DispatchPage() {
  const queryClient = useQueryClient()
  const [selectedJob, setSelectedJob] = useState<UnassignedJob | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [optimizing, setOptimizing] = useState(false)

  const { data: technicians, isLoading: loadingTechs } = useQuery<Technician[]>({
    queryKey: ['dispatch-technicians'],
    queryFn: async () => {
      const res = await fetch('/api/dispatch/technicians')
      if (!res.ok) throw new Error('Failed to fetch technicians')
      return res.json()
    },
  })

  const { data: unassignedJobs, isLoading: loadingJobs } = useQuery<UnassignedJob[]>({
    queryKey: ['unassigned-jobs'],
    queryFn: async () => {
      const res = await fetch('/api/dispatch/unassigned')
      if (!res.ok) throw new Error('Failed to fetch jobs')
      return res.json()
    },
  })

  const assignMutation = useMutation({
    mutationFn: async ({ jobId, technicianId }: { jobId: string; technicianId: string }) => {
      const res = await fetch('/api/dispatch/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, technicianId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to assign job')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-technicians'] })
      queryClient.invalidateQueries({ queryKey: ['unassigned-jobs'] })
      setSelectedJob(null)
      setShowAssignModal(false)
      toast.success('Job assigned successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign job')
    },
  })

  const openAssignModal = (job: UnassignedJob) => {
    setSelectedJob(job)
    setShowAssignModal(true)
  }

  const closeAssignModal = () => {
    setSelectedJob(null)
    setShowAssignModal(false)
  }

  const handleOptimize = async () => {
    setOptimizing(true)
    try {
      const res = await fetch('/api/ai/optimize-dispatch', {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Optimization failed')
      const result = await res.json()

      // Show appropriate message based on result
      if (result.assignments && result.assignments.length > 0) {
        toast.success(`Optimized ${result.assignments.length} assignments`)
      } else if (result.warnings && result.warnings.length > 0) {
        toast.error(result.warnings[0])
      } else {
        toast.success('No jobs to optimize')
      }

      queryClient.invalidateQueries({ queryKey: ['dispatch-technicians'] })
      queryClient.invalidateQueries({ queryKey: ['unassigned-jobs'] })
    } catch {
      toast.error('Optimization failed')
    } finally {
      setOptimizing(false)
    }
  }

  const handleAssign = (technicianId: string) => {
    if (selectedJob) {
      assignMutation.mutate({ jobId: selectedJob.id, technicianId })
    }
  }

  const isLoading = loadingTechs || loadingJobs

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dispatch Board</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage technician assignments and job dispatch
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/dispatch/map" className="btn-secondary flex items-center gap-2">
            <MapPinIcon className="w-5 h-5" />
            Map View
          </Link>
          <button
            onClick={handleOptimize}
            disabled={optimizing}
            className="btn-primary flex items-center gap-2"
          >
            {optimizing ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <SparklesIcon className="w-5 h-5" />
            )}
            AI Optimize
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Unassigned Jobs Queue */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <h2 className="section-title">Unassigned Jobs</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : unassignedJobs?.length ? (
                unassignedJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => openAssignModal(job)}
                    className="p-3 rounded-lg border cursor-pointer transition-all border-gray-200 hover:border-primary-500 hover:bg-primary-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{job.jobNumber}</span>
                      <span className={`badge ${getPriorityColor(job.priority)}`}>
                        {job.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-1">{job.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={`badge ${getTradeColor(job.tradeType)}`}>
                        {job.tradeType}
                      </span>
                      {job.timeWindowStart && job.timeWindowEnd && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {job.timeWindowStart} - {job.timeWindowEnd}
                        </span>
                      )}
                    </div>
                    {job.property && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <MapPinIcon className="w-3 h-3" />
                        {job.property.city}
                      </p>
                    )}
                    <p className="text-xs text-primary-600 mt-2 font-medium">
                      Click to assign technician
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No unassigned jobs</p>
              )}
            </div>
          </div>
        </div>

        {/* Technician Columns */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {technicians?.map((tech) => (
            <div
              key={tech.id}
              className="card"
            >
              {/* Technician Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {tech.user.firstName} {tech.user.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge ${getStatusColor(tech.status)}`}>
                      {tech.status.replace('_', ' ')}
                    </span>
                    <div className="flex gap-1">
                      {tech.tradeTypes.map((trade) => (
                        <span key={trade} className={`badge ${getTradeColor(trade)} text-xs`}>
                          {trade}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {tech.user.phone && (
                  <a href={`tel:${tech.user.phone}`} className="p-2 hover:bg-gray-100 rounded-lg">
                    <PhoneIcon className="w-5 h-5 text-gray-500" />
                  </a>
                )}
              </div>

              {/* Jobs */}
              <div className="space-y-2">
                {tech.assignments.length ? (
                  tech.assignments.map(({ job }) => (
                    <Link
                      key={job.id}
                      href={`/dashboard/jobs/${job.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{job.jobNumber}</span>
                        <span className={`badge ${getStatusColor(job.status)} text-xs`}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">{job.title}</p>
                      {job.timeWindowStart && job.timeWindowEnd && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {job.timeWindowStart} - {job.timeWindowEnd}
                        </p>
                      )}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No jobs assigned</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Assign Technician</h2>
                <p className="text-sm text-gray-500">
                  Select a technician to assign to job {selectedJob.jobNumber}
                </p>
              </div>
              <button
                onClick={closeAssignModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Job Details */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{selectedJob.jobNumber}</span>
                <div className="flex gap-2">
                  <span className={`badge ${getPriorityColor(selectedJob.priority)}`}>
                    {selectedJob.priority}
                  </span>
                  <span className={`badge ${getTradeColor(selectedJob.tradeType)}`}>
                    {selectedJob.tradeType}
                  </span>
                </div>
              </div>
              <p className="text-gray-700">{selectedJob.title}</p>
              {selectedJob.property && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {selectedJob.property.address}, {selectedJob.property.city}
                </p>
              )}
              {selectedJob.customer && (
                <p className="text-sm text-gray-500 mt-1">
                  Customer: {selectedJob.customer.firstName} {selectedJob.customer.lastName}
                </p>
              )}
            </div>

            {/* Technician List */}
            <div className="p-4 overflow-y-auto max-h-[400px]">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Available Technicians</h3>
              <div className="space-y-2">
                {technicians?.map((tech) => {
                  const hasMatchingSkill = tech.tradeTypes.includes(selectedJob.tradeType)
                  return (
                    <button
                      key={tech.id}
                      onClick={() => handleAssign(tech.id)}
                      disabled={assignMutation.isPending}
                      className={`w-full p-3 rounded-lg border text-left transition-all hover:border-primary-500 hover:bg-primary-50 ${
                        hasMatchingSkill ? 'border-green-200 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {tech.user.firstName} {tech.user.lastName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`badge ${getStatusColor(tech.status)} text-xs`}>
                                {tech.status.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {tech.assignments.length} job{tech.assignments.length !== 1 ? 's' : ''} assigned
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasMatchingSkill && (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <CheckIcon className="w-4 h-4" />
                              Skill match
                            </span>
                          )}
                          <div className="flex gap-1">
                            {tech.tradeTypes.map((trade) => (
                              <span
                                key={trade}
                                className={`badge ${getTradeColor(trade)} text-xs`}
                              >
                                {trade}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={closeAssignModal}
                className="btn-secondary w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
