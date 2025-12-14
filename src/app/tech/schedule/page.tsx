'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format, startOfDay, addDays, isSameDay } from 'date-fns'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  ClockIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import { cn, formatTime, getPriorityColor, getStatusColor } from '@/lib/utils'

interface Job {
  id: string
  jobNumber: string
  title: string
  status: string
  priority: string
  scheduledDate: string
  scheduledTime: string | null
  estimatedDuration: number
  customer: {
    firstName: string
    lastName: string
    phone: string
    address: string
    city: string
    state: string
  }
  serviceType: {
    name: string
    color: string
  }
}

export default function TechSchedulePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Generate week dates starting from today
  const today = startOfDay(new Date())
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(today, i))

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['my-jobs', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const res = await fetch(`/api/technicians/my-jobs?date=${format(selectedDate, 'yyyy-MM-dd')}`)
      if (!res.ok) throw new Error('Failed to fetch jobs')
      return res.json()
    }
  })

  const sortedJobs = [...jobs].sort((a, b) => {
    if (!a.scheduledTime) return 1
    if (!b.scheduledTime) return -1
    return a.scheduledTime.localeCompare(b.scheduledTime)
  })

  const handlePrevWeek = () => {
    setSelectedDate(prev => addDays(prev, -7))
  }

  const handleNextWeek = () => {
    setSelectedDate(prev => addDays(prev, 7))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-sm text-gray-500">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handlePrevWeek}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {format(weekDates[0], 'MMM d')} - {format(weekDates[6], 'MMM d')}
          </span>
          <button
            onClick={handleNextWeek}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date) => {
            const isSelected = isSameDay(date, selectedDate)
            const isToday = isSameDay(date, today)

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  'flex flex-col items-center py-2 rounded-lg transition-colors',
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : isToday
                    ? 'bg-primary-50 text-primary-600'
                    : 'hover:bg-gray-100'
                )}
              >
                <span className="text-xs font-medium">
                  {format(date, 'EEE')}
                </span>
                <span className={cn(
                  'text-lg font-bold',
                  !isSelected && !isToday && 'text-gray-900'
                )}>
                  {format(date, 'd')}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : sortedJobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No jobs scheduled for this day</p>
          </div>
        ) : (
          sortedJobs.map((job) => (
            <button
              key={job.id}
              onClick={() => router.push(`/tech/job/${job.id}`)}
              className="w-full bg-white rounded-lg border border-gray-200 p-4 text-left hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Time indicator */}
                <div className="flex-shrink-0 w-16 text-center">
                  <p className="text-sm font-bold text-gray-900">
                    {job.scheduledTime ? formatTime(job.scheduledTime) : 'TBD'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {job.estimatedDuration} min
                  </p>
                </div>

                {/* Service type color bar */}
                <div
                  className="w-1 self-stretch rounded-full"
                  style={{ backgroundColor: job.serviceType.color }}
                />

                {/* Job details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full',
                      getStatusColor(job.status)
                    )}>
                      {job.status}
                    </span>
                    {job.priority !== 'NORMAL' && (
                      <span className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        getPriorityColor(job.priority)
                      )}>
                        {job.priority}
                      </span>
                    )}
                  </div>

                  <p className="font-medium text-gray-900 truncate">
                    {job.customer.firstName} {job.customer.lastName}
                  </p>
                  <p className="text-sm text-gray-600 truncate">{job.title}</p>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-3.5 h-3.5" />
                      <span className="truncate">
                        {job.customer.address}, {job.customer.city}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <a
                      href={`tel:${job.customer.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-primary-600 font-medium"
                    >
                      <PhoneIcon className="w-3.5 h-3.5" />
                      Call
                    </a>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        `${job.customer.address}, ${job.customer.city}, ${job.customer.state}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-primary-600 font-medium"
                    >
                      <MapPinIcon className="w-3.5 h-3.5" />
                      Navigate
                    </a>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
