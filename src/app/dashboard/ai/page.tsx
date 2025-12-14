'use client'

import Link from 'next/link'
import {
  SparklesIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  ArrowRightIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  UsersIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  CubeIcon
} from '@heroicons/react/24/outline'

const aiFeatures = [
  {
    name: 'Dispatch Optimizer',
    description: 'Automatically assign jobs to technicians based on location, skills, and availability. Optimize routes and reduce travel time.',
    href: '/dashboard/ai/dispatch-optimizer',
    icon: TruckIcon,
    color: 'bg-blue-500',
    stats: [
      { label: 'Avg Time Saved', value: '25%' },
      { label: 'Fuel Savings', value: '15%' }
    ]
  },
  {
    name: 'Diagnostics Assistant',
    description: 'Get AI-powered diagnostic suggestions based on symptoms. Identify probable causes and recommended repair actions.',
    href: '/dashboard/ai/diagnostics',
    icon: WrenchScrewdriverIcon,
    color: 'bg-green-500',
    stats: [
      { label: 'Accuracy Rate', value: '92%' },
      { label: 'Time to Diagnose', value: '-40%' }
    ]
  },
  {
    name: 'Smart Scheduling',
    description: 'AI-powered appointment scheduling that considers travel time, job complexity, technician skills, and customer preferences.',
    href: '/dashboard/ai/smart-scheduling',
    icon: CalendarDaysIcon,
    color: 'bg-purple-500',
    stats: [
      { label: 'Schedule Efficiency', value: '+30%' },
      { label: 'Customer Satisfaction', value: '95%' }
    ]
  },
  {
    name: 'Predictive Maintenance',
    description: 'Predict equipment failures before they happen based on age, service history, and usage patterns. Prevent costly breakdowns.',
    href: '/dashboard/ai/predictive-maintenance',
    icon: ChartBarIcon,
    color: 'bg-orange-500',
    stats: [
      { label: 'Failure Prevention', value: '85%' },
      { label: 'Cost Savings', value: '40%' }
    ]
  },
  {
    name: 'Customer Insights',
    description: 'AI-powered customer analysis to identify VIPs, churn risks, and upsell opportunities. Maximize customer lifetime value.',
    href: '/dashboard/ai/customer-insights',
    icon: UsersIcon,
    color: 'bg-pink-500',
    stats: [
      { label: 'Retention Boost', value: '+20%' },
      { label: 'Revenue Growth', value: '+15%' }
    ]
  },
  {
    name: 'Quote Generator',
    description: 'Generate professional Good/Better/Best quotes instantly. AI calculates pricing based on service type, parts, and labor.',
    href: '/dashboard/ai/quote-generator',
    icon: DocumentTextIcon,
    color: 'bg-indigo-500',
    stats: [
      { label: 'Quote Time', value: '-80%' },
      { label: 'Win Rate', value: '+25%' }
    ]
  },
  {
    name: 'Job Summary',
    description: 'Transform technician notes into professional job reports. Auto-generate customer communications and follow-up recommendations.',
    href: '/dashboard/ai/job-summary',
    icon: ClipboardDocumentCheckIcon,
    color: 'bg-teal-500',
    stats: [
      { label: 'Report Quality', value: '+50%' },
      { label: 'Admin Time', value: '-60%' }
    ]
  },
  {
    name: 'Inventory Forecast',
    description: 'Predict inventory needs and optimize reorder timing. Prevent stockouts and reduce carrying costs with AI-powered forecasting.',
    href: '/dashboard/ai/inventory-forecast',
    icon: CubeIcon,
    color: 'bg-amber-500',
    stats: [
      { label: 'Stockout Reduction', value: '-70%' },
      { label: 'Inventory Savings', value: '+20%' }
    ]
  }
]

export default function AIPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SparklesIcon className="w-7 h-7 text-primary-600" />
          AI Features
        </h1>
        <p className="text-gray-500 mt-1">
          Leverage artificial intelligence to optimize your field service operations
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aiFeatures.map((feature) => (
          <Link
            key={feature.name}
            href={feature.href}
            className="card hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 ${feature.color} rounded-xl`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 group-hover:text-primary-600">
                  {feature.name}
                  <ArrowRightIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {feature.description}
                </p>
                <div className="flex gap-4 mt-4">
                  {feature.stats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="text-xl font-bold text-primary-600">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* AI Info */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="flex items-center gap-4">
          <SparklesIcon className="w-12 h-12 text-primary-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Powered by Advanced AI</h3>
            <p className="text-gray-600 text-sm">
              Our AI features use state-of-the-art language models to provide accurate diagnostics,
              optimal scheduling, predictive insights, and intelligent recommendations. All data is processed securely.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/ai/dispatch-optimizer" className="card hover:bg-blue-50 transition-colors text-center py-6">
          <TruckIcon className="w-8 h-8 mx-auto text-blue-600 mb-2" />
          <p className="font-medium text-gray-900 text-sm">Optimize Dispatch</p>
        </Link>
        <Link href="/dashboard/ai/diagnostics" className="card hover:bg-green-50 transition-colors text-center py-6">
          <WrenchScrewdriverIcon className="w-8 h-8 mx-auto text-green-600 mb-2" />
          <p className="font-medium text-gray-900 text-sm">Diagnose Issue</p>
        </Link>
        <Link href="/dashboard/ai/quote-generator" className="card hover:bg-indigo-50 transition-colors text-center py-6">
          <DocumentTextIcon className="w-8 h-8 mx-auto text-indigo-600 mb-2" />
          <p className="font-medium text-gray-900 text-sm">Generate Quote</p>
        </Link>
        <Link href="/dashboard/ai/customer-insights" className="card hover:bg-pink-50 transition-colors text-center py-6">
          <UsersIcon className="w-8 h-8 mx-auto text-pink-600 mb-2" />
          <p className="font-medium text-gray-900 text-sm">Customer Insights</p>
        </Link>
        <Link href="/dashboard/ai/smart-scheduling" className="card hover:bg-purple-50 transition-colors text-center py-6">
          <CalendarDaysIcon className="w-8 h-8 mx-auto text-purple-600 mb-2" />
          <p className="font-medium text-gray-900 text-sm">Smart Schedule</p>
        </Link>
        <Link href="/dashboard/ai/job-summary" className="card hover:bg-teal-50 transition-colors text-center py-6">
          <ClipboardDocumentCheckIcon className="w-8 h-8 mx-auto text-teal-600 mb-2" />
          <p className="font-medium text-gray-900 text-sm">Job Summary</p>
        </Link>
        <Link href="/dashboard/ai/predictive-maintenance" className="card hover:bg-orange-50 transition-colors text-center py-6">
          <ChartBarIcon className="w-8 h-8 mx-auto text-orange-600 mb-2" />
          <p className="font-medium text-gray-900 text-sm">Predict Maintenance</p>
        </Link>
        <Link href="/dashboard/ai/inventory-forecast" className="card hover:bg-amber-50 transition-colors text-center py-6">
          <CubeIcon className="w-8 h-8 mx-auto text-amber-600 mb-2" />
          <p className="font-medium text-gray-900 text-sm">Inventory Forecast</p>
        </Link>
      </div>
    </div>
  )
}
