'use client'

import Link from 'next/link'
import { ArrowLeftIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function DispatchBoardPage() {
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
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <CalendarDaysIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Dispatch Board</h1>
                  <p className="text-indigo-100 mt-1">Your command center for job scheduling</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Overview
                </h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700">
                    The dispatch board is your command center for managing daily operations.
                    It provides a visual overview of all technicians and their scheduled jobs,
                    making it easy to assign work and track progress.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Layout
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { area: 'Unassigned Jobs', location: 'Left Panel', desc: 'Jobs waiting to be scheduled' },
                    { area: 'Schedule Grid', location: 'Center', desc: 'Visual calendar by technician' },
                    { area: 'Map View', location: 'Right Panel', desc: 'Geographic view of jobs' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="font-semibold text-indigo-900">{item.area}</p>
                      <p className="text-xs text-indigo-600 mb-1">{item.location}</p>
                      <p className="text-sm text-indigo-700">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Viewing Options
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { view: 'Day View', desc: 'Single day schedule' },
                    { view: 'Week View', desc: 'Full week overview' },
                    { view: 'List View', desc: 'Tabular job list' },
                    { view: 'Map View', desc: 'Geographic distribution' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg text-center">
                      <p className="font-medium text-gray-900">{item.view}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Drag and Drop Scheduling
                </h2>
                <div className="space-y-3">
                  {[
                    'Find the job in the Unassigned panel',
                    'Click and hold the job card',
                    'Drag it onto a technician\'s timeline',
                    'Drop it on the desired time slot',
                    'The job is automatically assigned and scheduled',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Technician Status Indicators
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { status: 'Available', color: 'bg-green-100 text-green-700 border-green-300' },
                    { status: 'En Route', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
                    { status: 'On Job', color: 'bg-orange-100 text-orange-700 border-orange-300' },
                    { status: 'Unavailable', color: 'bg-red-100 text-red-700 border-red-300' },
                    { status: 'Offline', color: 'bg-gray-100 text-gray-500 border-gray-300' },
                  ].map((item, i) => (
                    <div key={i} className={`px-4 py-2 rounded-lg border ${item.color} font-medium text-center`}>
                      {item.status}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Job Color Coding
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { type: 'Service Call', color: 'bg-blue-100 text-blue-700 border-blue-300' },
                    { type: 'Maintenance', color: 'bg-green-100 text-green-700 border-green-300' },
                    { type: 'Repair', color: 'bg-orange-100 text-orange-700 border-orange-300' },
                    { type: 'Emergency', color: 'bg-red-100 text-red-700 border-red-300' },
                    { type: 'Installation', color: 'bg-purple-100 text-purple-700 border-purple-300' },
                  ].map((item, i) => (
                    <div key={i} className={`px-4 py-2 rounded-lg border ${item.color} font-medium text-center`}>
                      {item.type}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Quick Actions
                </h2>
                <p className="text-gray-600 mb-4">Right-click on a job for quick actions:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    'View job details',
                    'Edit job',
                    'Reassign to another technician',
                    'Reschedule to another time',
                    'Contact customer',
                    'Cancel job',
                  ].map((action, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="text-gray-700">{action}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Keyboard Shortcuts
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { key: 'N', action: 'New job' },
                    { key: 'T', action: 'Today\'s view' },
                    { key: '←/→', action: 'Previous/Next day' },
                    { key: 'M', action: 'Toggle map' },
                    { key: 'R', action: 'Refresh' },
                  ].map((shortcut, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <kbd className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm font-mono">{shortcut.key}</kbd>
                      <span className="text-gray-700">{shortcut.action}</span>
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
                      Use the filter options to show only specific job types or technicians.
                      This is especially useful when managing large teams.
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
