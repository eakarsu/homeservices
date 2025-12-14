'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'

interface ReportData {
  revenue: {
    today: number
    week: number
    month: number
    year: number
    monthOverMonth: number
  }
  jobs: {
    completed: number
    scheduled: number
    avgDuration: number
    avgRevenue: number
  }
  technicians: {
    avgJobsPerDay: number
    topPerformer: string
    utilizationRate: number
  }
  customers: {
    new: number
    total: number
    repeatRate: number
  }
}

export default function ReportsPage() {
  const router = useRouter()
  const [dateRange, setDateRange] = useState('month')

  const { data: report, isLoading } = useQuery<ReportData>({
    queryKey: ['reports', dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/reports?range=${dateRange}`)
      if (!res.ok) throw new Error('Failed to fetch reports')
      return res.json()
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Business analytics and insights</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="input w-40"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 90 Days</option>
          <option value="year">Last 12 Months</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Revenue Overview */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
              Revenue Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-2xl font-bold">{formatCurrency(report?.revenue.today || 0)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">This Week</p>
                <p className="text-2xl font-bold">{formatCurrency(report?.revenue.week || 0)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold">{formatCurrency(report?.revenue.month || 0)}</p>
                {report?.revenue.monthOverMonth !== undefined && (
                  <p className={`text-sm flex items-center gap-1 ${report.revenue.monthOverMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {report.revenue.monthOverMonth >= 0 ? (
                      <ArrowTrendingUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4" />
                    )}
                    {Math.abs(report.revenue.monthOverMonth)}% vs last month
                  </p>
                )}
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">This Year</p>
                <p className="text-2xl font-bold">{formatCurrency(report?.revenue.year || 0)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Jobs Performance */}
            <div
              onClick={() => router.push('/dashboard/jobs')}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <WrenchScrewdriverIcon className="w-5 h-5 text-blue-600" />
                Jobs Performance
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed Jobs</span>
                  <span className="font-bold text-xl">{report?.jobs.completed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Scheduled Jobs</span>
                  <span className="font-bold text-xl">{report?.jobs.scheduled || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Duration</span>
                  <span className="font-bold">{report?.jobs.avgDuration || 0} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Revenue/Job</span>
                  <span className="font-bold text-green-600">{formatCurrency(report?.jobs.avgRevenue || 0)}</span>
                </div>
              </div>
            </div>

            {/* Technician Performance */}
            <div
              onClick={() => router.push('/dashboard/technicians')}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-purple-600" />
                Technician Metrics
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Jobs/Day</span>
                  <span className="font-bold text-xl">{report?.technicians.avgJobsPerDay?.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Utilization Rate</span>
                  <span className="font-bold">{report?.technicians.utilizationRate || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Top Performer</span>
                  <span className="font-bold text-primary-600">{report?.technicians.topPerformer || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Customer Metrics */}
            <div
              onClick={() => router.push('/dashboard/customers')}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-orange-600" />
                Customer Metrics
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">New Customers</span>
                  <span className="font-bold text-xl text-green-600">{report?.customers.new || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Customers</span>
                  <span className="font-bold text-xl">{report?.customers.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Repeat Rate</span>
                  <span className="font-bold">{report?.customers.repeatRate || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Reports */}
          <div className="card">
            <h2 className="font-semibold mb-4">Quick Reports</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/dashboard/reports/daily"
                aria-label="Daily Report"
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-left transition-colors cursor-pointer block"
              >
                <CalendarDaysIcon className="w-6 h-6 text-blue-600 mb-2" />
                <p className="font-medium">Daily Summary</p>
                <p className="text-sm text-gray-500">Jobs and revenue by day</p>
              </Link>
              <Link
                href="/dashboard/reports/technicians"
                aria-label="Technician Report"
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-left transition-colors cursor-pointer block"
              >
                <UserGroupIcon className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-medium">Technician Report</p>
                <p className="text-sm text-gray-500">Performance by tech</p>
              </Link>
              <Link
                href="/dashboard/reports/services"
                aria-label="Services Report"
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-left transition-colors cursor-pointer block"
              >
                <WrenchScrewdriverIcon className="w-6 h-6 text-green-600 mb-2" />
                <p className="font-medium">Services Report</p>
                <p className="text-sm text-gray-500">Revenue by service</p>
              </Link>
              <Link
                href="/dashboard/reports/aging"
                aria-label="Aging Report"
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-left transition-colors cursor-pointer block"
              >
                <CurrencyDollarIcon className="w-6 h-6 text-orange-600 mb-2" />
                <p className="font-medium">Aging Report</p>
                <p className="text-sm text-gray-500">Outstanding invoices</p>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
