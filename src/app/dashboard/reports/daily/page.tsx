'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'

interface DailyReport {
  date: string
  jobs: number
  completed: number
  revenue: number
}

interface DailyReportResponse {
  period: string
  data: DailyReport[]
}

export default function DailyReportPage() {
  const router = useRouter()
  const [days, setDays] = useState(7)

  const { data: response, isLoading } = useQuery<DailyReportResponse>({
    queryKey: ['reports-daily', days],
    queryFn: async () => {
      const res = await fetch(`/api/reports/daily?days=${days}`)
      if (!res.ok) throw new Error('Failed to fetch daily report')
      return res.json()
    },
  })

  const reports = response?.data || []

  const totals = reports.reduce(
    (acc, day) => ({
      jobsCompleted: acc.jobsCompleted + (day.completed || 0),
      jobsScheduled: acc.jobsScheduled + (day.jobs || 0),
      revenue: acc.revenue + (day.revenue || 0),
    }),
    { jobsCompleted: 0, jobsScheduled: 0, revenue: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/reports')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Daily Summary Report</h1>
          <p className="text-sm text-gray-500">Jobs and revenue breakdown by day</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="input w-40"
        >
          <option value={7}>Last 7 Days</option>
          <option value={14}>Last 14 Days</option>
          <option value={30}>Last 30 Days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Jobs Completed</p>
          <p className="text-2xl font-bold text-green-600">{totals?.jobsCompleted || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Jobs Scheduled</p>
          <p className="text-2xl font-bold text-blue-600">{totals?.jobsScheduled || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-primary-600">{formatCurrency(totals?.revenue || 0)}</p>
        </div>
      </div>

      {/* Daily Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jobs Completed</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jobs Scheduled</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Duration</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((day) => (
                <tr key={day.date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-medium">
                    {day.completed || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-blue-600 font-medium">
                    {day.jobs || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    {formatCurrency(day.revenue || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500">
                    -
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
