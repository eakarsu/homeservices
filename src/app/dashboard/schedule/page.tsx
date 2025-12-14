'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
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
  scheduledEnd?: string
  timeWindowStart?: string
  timeWindowEnd?: string
  estimatedDuration?: number
  customer: {
    firstName?: string
    lastName?: string
    companyName?: string
  }
  property?: {
    address: string
    city: string
  }
  assignments: Array<{
    technician: {
      id: string
      user: {
        firstName: string
        lastName: string
      }
    }
  }>
}

interface Technician {
  id: string
  color?: string
  user: {
    firstName: string
    lastName: string
  }
}

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'week' | 'day'>('week')

  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)

  const { data: jobs } = useQuery<Job[]>({
    queryKey: ['schedule-jobs', startOfWeek.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startOfWeek.toISOString(),
        endDate: endOfWeek.toISOString(),
        pageSize: '100',
      })
      const res = await fetch(`/api/jobs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch jobs')
      const data = await res.json()
      return data.data || []
    },
  })

  const { data: technicians } = useQuery<Technician[]>({
    queryKey: ['technicians'],
    queryFn: async () => {
      const res = await fetch('/api/technicians')
      if (!res.ok) throw new Error('Failed to fetch technicians')
      return res.json()
    },
  })

  const hours = Array.from({ length: 12 }, (_, i) => i + 7) // 7 AM to 6 PM
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    return day
  })

  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - (view === 'week' ? 7 : 1))
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (view === 'week' ? 7 : 1))
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getJobsForDay = (date: Date) => {
    if (!jobs) return []
    return jobs.filter(job => {
      if (!job.scheduledStart) return false
      const jobDate = new Date(job.scheduledStart)
      return jobDate.toDateString() === date.toDateString()
    })
  }

  const getJobPosition = (job: Job) => {
    if (!job.scheduledStart) return { top: 0, height: 60 }
    const start = new Date(job.scheduledStart)
    const hours = start.getHours()
    const minutes = start.getMinutes()
    const top = ((hours - 7) * 60 + minutes) * (60 / 60) // 60px per hour
    const height = (job.estimatedDuration || 60) * (60 / 60)
    return { top: Math.max(0, top), height: Math.max(30, height) }
  }

  const getCustomerName = (job: Job) => {
    const personalName = `${job.customer?.firstName || ''} ${job.customer?.lastName || ''}`.trim()
    if (personalName && job.customer?.companyName) {
      return `${personalName} (${job.customer.companyName})`
    }
    return personalName || job.customer?.companyName || 'Unknown'
  }

  const getTechColor = (job: Job) => {
    const techId = job.assignments[0]?.technician?.id
    const tech = technicians?.find(t => t.id === techId)
    return tech?.color || '#3B82F6'
  }

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 rounded text-sm ${view === 'day' ? 'bg-white shadow' : ''}`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded text-sm ${view === 'week' ? 'bg-white shadow' : ''}`}
            >
              Week
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToPrevious} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button onClick={goToToday} className="btn-secondary text-sm">
            Today
          </button>
          <button onClick={goToNext} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          <Link href="/dashboard/jobs/new" className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            New Job
          </Link>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold">
          {startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
      </div>

      {/* Calendar Grid */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b">
              <div className="p-2 text-center text-sm text-gray-500 border-r">Time</div>
              {(view === 'week' ? days : [currentDate]).map((day, i) => (
                <div
                  key={i}
                  className={`p-2 text-center border-r last:border-r-0 ${
                    isToday(day) ? 'bg-primary-50' : ''
                  }`}
                >
                  <p className={`text-sm font-medium ${isToday(day) ? 'text-primary-600' : 'text-gray-900'}`}>
                    {formatDateHeader(day)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getJobsForDay(day).length} jobs
                  </p>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="relative">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b" style={{ height: '60px' }}>
                  <div className="p-1 text-xs text-gray-500 text-right pr-2 border-r">
                    {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                  </div>
                  {(view === 'week' ? days : [currentDate]).map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`relative border-r last:border-r-0 ${isToday(day) ? 'bg-primary-50/30' : ''}`}
                    />
                  ))}
                </div>
              ))}

              {/* Job Overlays */}
              {(view === 'week' ? days : [currentDate]).map((day, dayIndex) => {
                const dayJobs = getJobsForDay(day)
                return dayJobs.map((job) => {
                  const { top, height } = getJobPosition(job)
                  const colWidth = 100 / (view === 'week' ? 7 : 1)
                  const left = 12.5 + dayIndex * colWidth // 12.5% for time column
                  return (
                    <Link
                      key={job.id}
                      href={`/dashboard/jobs/${job.id}`}
                      className="absolute rounded px-1 py-0.5 text-xs overflow-hidden hover:opacity-80 transition-opacity"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `${left + 0.5}%`,
                        width: `${colWidth - 1}%`,
                        backgroundColor: getTechColor(job),
                        color: 'white',
                      }}
                    >
                      <p className="font-medium truncate">{job.jobNumber}</p>
                      <p className="truncate opacity-90">{getCustomerName(job)}</p>
                      {height > 40 && (
                        <p className="truncate opacity-75">{job.property?.city}</p>
                      )}
                    </Link>
                  )
                })
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      {technicians && technicians.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-gray-500">Technicians:</span>
          {technicians.map((tech) => (
            <div key={tech.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: tech.color || '#3B82F6' }}
              />
              <span className="text-sm">
                {tech.user.firstName} {tech.user.lastName}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
