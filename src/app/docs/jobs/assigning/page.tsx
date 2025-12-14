'use client'

import Link from 'next/link'
import { ArrowLeftIcon, UserPlusIcon, SparklesIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function AssigningTechniciansPage() {
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
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <UserPlusIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Assigning Technicians</h1>
                  <p className="text-emerald-100 mt-1">Learn how to assign the right technician to each job</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Manual Assignment
                </h2>
                <p className="text-gray-600 mb-4">To manually assign a technician to a job:</p>
                <div className="space-y-3">
                  {[
                    'Open the job details or edit the job',
                    'Click on the Assigned Technician field',
                    'Select a technician from the dropdown',
                    'Save the job',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Dispatch Board Assignment
                </h2>
                <p className="text-gray-600 mb-4">Using the dispatch board for visual assignment:</p>
                <div className="space-y-3">
                  {[
                    'Navigate to Dispatch → Dispatch Board',
                    'Find unassigned jobs in the left panel',
                    'Drag the job onto a technician\'s schedule',
                    'Drop it on the desired time slot',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-emerald-900 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-amber-500" />
                  AI-Powered Assignment
                </h2>
                <p className="text-gray-600 mb-4">Let ServiceCrew AI suggest the best technician based on:</p>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {[
                    { name: 'Skills', desc: 'Match technician skills to job requirements' },
                    { name: 'Location', desc: 'Minimize travel time and fuel costs' },
                    { name: 'Availability', desc: 'Check existing schedule conflicts' },
                    { name: 'Workload', desc: 'Balance jobs across the team' },
                    { name: 'Customer History', desc: 'Same tech for repeat customers' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="font-medium text-amber-900">{item.name}</p>
                      <p className="text-sm text-amber-700">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 rounded-lg p-6">
                  <p className="font-medium text-amber-900 mb-3">To use AI assignment:</p>
                  <div className="space-y-2">
                    {[
                      'Click "Suggest Technician" on the job form',
                      'Review the AI recommendation and reasoning',
                      'Accept the suggestion or choose another tech',
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {i + 1}
                        </div>
                        <span className="text-amber-900">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Bulk Assignment
                </h2>
                <p className="text-gray-600 mb-4">Assign multiple jobs at once:</p>
                <div className="space-y-3">
                  {[
                    'Go to Jobs list view',
                    'Select multiple jobs using checkboxes',
                    'Click Bulk Actions → Assign Technician',
                    'Choose a technician and confirm',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Reassigning Jobs
                </h2>
                <p className="text-gray-600 mb-4">To move a job to a different technician:</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { name: 'Edit Job', desc: 'Change assigned technician' },
                    { name: 'Drag & Drop', desc: 'Move on dispatch board' },
                    { name: 'Notifications', desc: 'Both techs notified of change' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg text-center">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Technician Availability
                </h2>
                <p className="text-gray-600 mb-4">Check availability before assigning:</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    'View schedules on dispatch board',
                    'Check time-off requests',
                    'See current job status',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-gray-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">Best Practice</h3>
                    <p className="text-green-800 text-sm">
                      When possible, assign the same technician to repeat customers. This builds
                      rapport and allows the tech to become familiar with the customer's equipment.
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
