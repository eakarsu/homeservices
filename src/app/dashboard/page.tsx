'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'

interface DashboardStats {
  todayJobs: number
  pendingJobs: number
  completedToday: number
  revenue: {
    today: number
    week: number
    month: number
  }
  techniciansAvailable: number
  openEstimates: number
  overdueInvoices: number
  expiringAgreements: number
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
  })

  const { data: recentJobs } = useQuery({
    queryKey: ['recent-jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs?limit=5&sort=createdAt:desc')
      if (!res.ok) throw new Error('Failed to fetch jobs')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    {
      name: "Today's Jobs",
      value: stats?.todayJobs || 0,
      icon: WrenchScrewdriverIcon,
      color: 'bg-blue-500',
      href: '/dashboard/jobs?filter=today',
    },
    {
      name: 'Pending Jobs',
      value: stats?.pendingJobs || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      href: '/dashboard/jobs?status=PENDING',
    },
    {
      name: 'Completed Today',
      value: stats?.completedToday || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      href: '/dashboard/jobs?status=COMPLETED&filter=today',
    },
    {
      name: 'Techs Available',
      value: stats?.techniciansAvailable || 0,
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      href: '/dashboard/technicians',
    },
  ]

  const revenueCards = [
    { label: 'Today', value: stats?.revenue?.today || 0 },
    { label: 'This Week', value: stats?.revenue?.week || 0 },
    { label: 'This Month', value: stats?.revenue?.month || 0 },
  ]

  const alertCards = [
    {
      name: 'Open Estimates',
      value: stats?.openEstimates || 0,
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      href: '/dashboard/estimates?status=SENT',
    },
    {
      name: 'Overdue Invoices',
      value: stats?.overdueInvoices || 0,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      href: '/dashboard/invoices?status=OVERDUE',
    },
    {
      name: 'Expiring Agreements',
      value: stats?.expiringAgreements || 0,
      icon: ClockIcon,
      color: 'text-orange-600',
      href: '/dashboard/agreements?filter=expiring',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <Link href="/dashboard/jobs/new" className="btn-primary">
          + New Job
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.name} href={stat.href} className="stat-card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Revenue Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Revenue Overview</h2>
          <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {revenueCards.map((card) => (
            <div key={card.label} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(card.value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Recent Jobs</h2>
            <Link href="/dashboard/jobs" className="text-sm text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentJobs?.data?.length ? (
              recentJobs.data.map((job: {
                id: string
                jobNumber: string
                title: string
                status: string
                customer: { firstName?: string; lastName?: string }
              }) => (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{job.jobNumber}</p>
                    <p className="text-sm text-gray-600">{job.title}</p>
                    <p className="text-xs text-gray-500">
                      {job.customer?.firstName} {job.customer?.lastName}
                    </p>
                  </div>
                  <span className={`badge ${
                    job.status === 'COMPLETED' ? 'badge-success' :
                    job.status === 'IN_PROGRESS' ? 'badge-info' :
                    job.status === 'PENDING' ? 'badge-warning' :
                    'badge-gray'
                  }`}>
                    {job.status}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent jobs</p>
            )}
          </div>
        </div>

        {/* Alerts & Actions */}
        <div className="card">
          <h2 className="section-title">Alerts & Actions</h2>
          <div className="space-y-3">
            {alertCards.map((alert) => (
              <Link
                key={alert.name}
                href={alert.href}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <alert.icon className={`w-5 h-5 ${alert.color}`} />
                  <span className="text-gray-700">{alert.name}</span>
                </div>
                <span className="text-xl font-bold text-gray-900">{alert.value}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="section-title">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/jobs/new"
            className="flex flex-col items-center gap-2 p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors text-primary-700"
          >
            <WrenchScrewdriverIcon className="w-8 h-8" />
            <span className="text-sm font-medium">New Job</span>
          </Link>
          <Link
            href="/dashboard/customers/new"
            className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-blue-700"
          >
            <UserGroupIcon className="w-8 h-8" />
            <span className="text-sm font-medium">New Customer</span>
          </Link>
          <Link
            href="/dashboard/estimates/new"
            className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-green-700"
          >
            <DocumentTextIcon className="w-8 h-8" />
            <span className="text-sm font-medium">New Estimate</span>
          </Link>
          <Link
            href="/dashboard/dispatch"
            className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-purple-700"
          >
            <ClockIcon className="w-8 h-8" />
            <span className="text-sm font-medium">Dispatch Board</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
