'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, UserGroupIcon, StarIcon } from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'

interface TechnicianReport {
  id: string
  name: string
  email: string
  totalJobs: number
  completedJobs: number
  revenue: number
  avgJobTime: number
}

export default function TechnicianReportPage() {
  const router = useRouter()

  const { data: technicians, isLoading } = useQuery<TechnicianReport[]>({
    queryKey: ['reports-technicians'],
    queryFn: async () => {
      const res = await fetch('/api/reports/technicians')
      if (!res.ok) throw new Error('Failed to fetch technician report')
      return res.json()
    },
  })

  const totals = technicians?.reduce(
    (acc, tech) => ({
      jobsCompleted: acc.jobsCompleted + (tech.completedJobs || 0),
      revenue: acc.revenue + (tech.revenue || 0),
    }),
    { jobsCompleted: 0, revenue: 0 }
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Technician Performance Report</h1>
          <p className="text-sm text-gray-500">Performance metrics by technician</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Technicians</p>
          <p className="text-2xl font-bold text-purple-600">{technicians?.length || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Jobs Completed</p>
          <p className="text-2xl font-bold text-green-600">{totals?.jobsCompleted || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-primary-600">{formatCurrency(totals?.revenue || 0)}</p>
        </div>
      </div>

      {/* Technicians Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Jobs</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Completed</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {technicians?.map((tech) => (
                <tr
                  key={tech.id}
                  onClick={() => router.push(`/dashboard/technicians/${tech.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <UserGroupIcon className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="font-medium">{tech.name}</span>
                        <p className="text-sm text-gray-500">{tech.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    {tech.totalJobs || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-medium">
                    {tech.completedJobs || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    {formatCurrency(tech.revenue || 0)}
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
