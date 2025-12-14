'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'
import { formatCurrency, getTradeColor } from '@/lib/utils'

interface ServiceReport {
  id: string
  name: string
  totalJobs: number
  completedJobs: number
  revenue: number
  avgTicket: number
}

export default function ServicesReportPage() {
  const router = useRouter()

  const { data: services, isLoading } = useQuery<ServiceReport[]>({
    queryKey: ['reports-services'],
    queryFn: async () => {
      const res = await fetch('/api/reports/services')
      if (!res.ok) throw new Error('Failed to fetch services report')
      return res.json()
    },
  })

  const totals = services?.reduce(
    (acc, svc) => ({
      jobCount: acc.jobCount + svc.totalJobs,
      revenue: acc.revenue + svc.revenue,
    }),
    { jobCount: 0, revenue: 0 }
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
          <h1 className="text-2xl font-bold text-gray-900">Service Types Report</h1>
          <p className="text-sm text-gray-500">Revenue breakdown by service type</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Service Types</p>
          <p className="text-2xl font-bold text-blue-600">{services?.length || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Jobs</p>
          <p className="text-2xl font-bold text-green-600">{totals?.jobCount || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-primary-600">{formatCurrency(totals?.revenue || 0)}</p>
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Cards View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services?.map((svc) => (
              <div key={svc.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <span className={`badge ${getTradeColor(svc.name)}`}>
                    {svc.name}
                  </span>
                  <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Jobs</span>
                    <span className="font-bold">{svc.totalJobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Completed</span>
                    <span className="font-bold text-green-600">{svc.completedJobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Revenue</span>
                    <span className="font-bold text-green-600">{formatCurrency(svc.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg Ticket</span>
                    <span className="font-medium">{formatCurrency(svc.avgTicket)}</span>
                  </div>
                </div>
                {/* Revenue Bar */}
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-500 mb-1">
                    {totals && totals.revenue > 0 ? Math.round((svc.revenue / totals.revenue) * 100) : 0}% of total revenue
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${totals && totals.revenue > 0 ? (svc.revenue / totals.revenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table View */}
          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Jobs</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Completed</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Ticket</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services?.map((svc) => (
                  <tr key={svc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getTradeColor(svc.name)}`}>
                        {svc.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      {svc.totalJobs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-medium">
                      {svc.completedJobs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-medium">
                      {formatCurrency(svc.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      {formatCurrency(svc.avgTicket)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      {totals && totals.revenue > 0 ? Math.round((svc.revenue / totals.revenue) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
