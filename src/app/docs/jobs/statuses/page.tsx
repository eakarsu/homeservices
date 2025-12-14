'use client'

import Link from 'next/link'
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function JobStatusesPage() {
  const statuses = [
    { name: 'Unscheduled', color: 'bg-gray-100 text-gray-700 border-gray-300', description: 'Job created but not yet scheduled' },
    { name: 'Scheduled', color: 'bg-blue-100 text-blue-700 border-blue-300', description: 'Job has a date and time assigned' },
    { name: 'Dispatched', color: 'bg-purple-100 text-purple-700 border-purple-300', description: 'Technician has been notified' },
    { name: 'En Route', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', description: 'Technician is traveling to the job' },
    { name: 'In Progress', color: 'bg-orange-100 text-orange-700 border-orange-300', description: 'Technician is on-site working' },
    { name: 'On Hold', color: 'bg-red-100 text-red-700 border-red-300', description: 'Job paused (waiting for parts, etc.)' },
    { name: 'Completed', color: 'bg-green-100 text-green-700 border-green-300', description: 'Work finished successfully' },
    { name: 'Cancelled', color: 'bg-gray-100 text-gray-500 border-gray-300', description: 'Job was cancelled' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/docs" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-500 mb-6 font-medium">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Documentation
          </Link>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <ArrowPathIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Job Statuses</h1>
                  <p className="text-cyan-100 mt-1">Understanding job status workflow</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Status Overview
                </h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700">
                    Every job in ServiceCrew AI has a status that indicates where it is in the
                    service workflow. Statuses update automatically as work progresses, or can
                    be manually changed by dispatchers and technicians.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  All Statuses
                </h2>
                <div className="grid gap-3">
                  {statuses.map((status) => (
                    <div key={status.name} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${status.color}`}>
                        {status.name}
                      </span>
                      <p className="text-gray-600">{status.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Status Flow
                </h2>
                <p className="text-gray-600 mb-4">The typical progression of a job through statuses:</p>
                <div className="space-y-3">
                  {[
                    { status: 'Unscheduled', action: 'Job is created' },
                    { status: 'Scheduled', action: 'Date/time assigned' },
                    { status: 'Dispatched', action: 'Technician notified (morning of)' },
                    { status: 'En Route', action: 'Tech clicks "On My Way"' },
                    { status: 'In Progress', action: 'Tech arrives and starts work' },
                    { status: 'Completed', action: 'Work finished, invoice created' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                      <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-cyan-900">{item.status}</span>
                        <span className="text-cyan-600">→</span>
                        <span className="text-cyan-800">{item.action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Automatic Status Updates
                </h2>
                <p className="text-gray-600 mb-4">Some status changes happen automatically:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    'Jobs auto-dispatch on morning of scheduled date',
                    'Status changes to "En Route" when tech navigates',
                    'GPS arrival detection can trigger "In Progress"',
                    'Completing the job form marks it "Completed"',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                      <span className="text-gray-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Manual Status Changes
                </h2>
                <p className="text-gray-600 mb-4">Dispatchers can manually change status when needed:</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { name: 'On Hold', desc: 'Waiting for parts or scheduling' },
                    { name: 'Cancelled', desc: 'Job won\'t be completed' },
                    { name: 'Re-open', desc: 'Completed jobs need follow-up' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Status Notifications
                </h2>
                <p className="text-gray-600 mb-4">Customers can receive automatic notifications when status changes:</p>
                <div className="space-y-3">
                  {[
                    { status: 'En Route', message: '"Your technician is on the way"' },
                    { status: 'In Progress', message: '"Your technician has arrived"' },
                    { status: 'Completed', message: '"Your service is complete"' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <span className="font-medium text-green-700">{item.status}</span>
                      <span className="text-green-600">→</span>
                      <span className="text-green-800 italic">{item.message}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Pro Tip</h3>
                    <p className="text-blue-800 text-sm">
                      Configure automatic customer notifications in Settings → Notifications to keep
                      customers informed without manual effort.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
