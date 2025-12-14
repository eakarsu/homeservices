'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MapPinIcon,
  CalendarIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { formatDateTime, getStatusColor, getPriorityColor, getTradeColor } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Job {
  id: string
  jobNumber: string
  title: string
  status: string
  priority: string
  type: string
  tradeType: string
  scheduledStart?: string
  timeWindowStart?: string
  timeWindowEnd?: string
  customer: {
    id: string
    firstName?: string
    lastName?: string
    companyName?: string
    phone?: string
  }
  property?: {
    id: string
    address: string
    city: string
    state: string
  }
  assignments: {
    technician: {
      user: {
        firstName: string
        lastName: string
      }
    }
    isPrimary: boolean
  }[]
}

export default function JobsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [tradeFilter, setTradeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete job')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast.success('Job deleted successfully')
      setDeleteModalOpen(false)
      setJobToDelete(null)
    },
    onError: () => {
      toast.error('Failed to delete job')
    }
  })

  const handleDeleteClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation()
    setJobToDelete(job)
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (jobToDelete) {
      deleteMutation.mutate(jobToDelete.id)
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', search, statusFilter, priorityFilter, tradeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
      })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (priorityFilter) params.set('priority', priorityFilter)
      if (tradeFilter) params.set('tradeType', tradeFilter)

      const res = await fetch(`/api/jobs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch jobs')
      return res.json()
    },
  })

  const getCustomerName = (job: Job) => {
    const personalName = `${job.customer.firstName || ''} ${job.customer.lastName || ''}`.trim()
    if (personalName && job.customer.companyName) {
      return `${personalName} (${job.customer.companyName})`
    }
    return personalName || job.customer.companyName || 'Unknown'
  }

  const getTechnicianName = (job: Job) => {
    const primary = job.assignments.find(a => a.isPrimary) || job.assignments[0]
    if (!primary) return 'Unassigned'
    return `${primary.technician.user.firstName} ${primary.technician.user.lastName}`
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Jobs</h1>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'board' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Board
            </button>
          </div>
          <Link href="/dashboard/jobs/new" className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            New Job
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              className="input pl-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <select
            className="select w-full md:w-36"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="EN_ROUTE">En Route</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            className="select w-full md:w-36"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Priority</option>
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
          <select
            className="select w-full md:w-36"
            value={tradeFilter}
            onChange={(e) => {
              setTradeFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Trades</option>
            <option value="HVAC">HVAC</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="GENERAL">General</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : data?.data?.length ? (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="table-header">Job</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Location</th>
                  <th className="table-header">Scheduled</th>
                  <th className="table-header">Technician</th>
                  <th className="table-header">Trade</th>
                  <th className="table-header">Priority</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.data.map((job: Job) => (
                  <tr
                    key={job.id}
                    onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="table-cell">
                      <p className="font-medium text-gray-900">
                        {job.jobNumber}
                      </p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{job.title}</p>
                    </td>
                    <td className="table-cell">
                      {getCustomerName(job)}
                    </td>
                    <td className="table-cell">
                      {job.property && (
                        <div className="flex items-start gap-1">
                          <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm">{job.property.address}</p>
                            <p className="text-xs text-gray-500">
                              {job.property.city}, {job.property.state}
                            </p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      {job.scheduledStart ? (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm">{formatDateTime(job.scheduledStart)}</p>
                            {job.timeWindowStart && job.timeWindowEnd && (
                              <p className="text-xs text-gray-500">
                                {job.timeWindowStart} - {job.timeWindowEnd}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not scheduled</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={job.assignments.length ? '' : 'text-gray-400'}>
                        {getTechnicianName(job)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getTradeColor(job.tradeType)}`}>
                        {job.tradeType}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getPriorityColor(job.priority)}`}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <button
                        onClick={(e) => handleDeleteClick(e, job)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete job"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.total)} of {data.total} jobs
              </p>
              <div className="flex gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= data.totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No jobs found
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && jobToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Job</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete job <span className="font-medium">{jobToDelete.jobNumber}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setJobToDelete(null)
                }}
                className="btn-secondary"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn-primary bg-red-600 hover:bg-red-700"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
