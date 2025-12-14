'use client'

import Link from 'next/link'
import { ArrowLeftIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function RecurringJobsPage() {
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
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <ArrowPathRoundedSquareIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Recurring Jobs</h1>
                  <p className="text-orange-100 mt-1">Automatic scheduling for maintenance and repeat services</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  What Are Recurring Jobs?
                </h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700">
                    Recurring jobs are automatically created on a schedule, perfect for
                    maintenance contracts, seasonal tune-ups, and regular service agreements.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Creating a Recurring Job
                </h2>
                <div className="space-y-3">
                  {[
                    'Create a new job as usual',
                    'Enable Make Recurring',
                    'Set the recurrence pattern',
                    'Define the end date or number of occurrences',
                    'Save the job',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Recurrence Patterns
                </h2>
                <p className="text-gray-600 mb-4">Choose from flexible scheduling options:</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { pattern: 'Daily', desc: 'Every day or every X days' },
                    { pattern: 'Weekly', desc: 'Specific days of the week' },
                    { pattern: 'Monthly', desc: 'Same date or same day' },
                    { pattern: 'Quarterly', desc: 'Every 3 months' },
                    { pattern: 'Semi-Annual', desc: 'Every 6 months' },
                    { pattern: 'Annual', desc: 'Once per year' },
                    { pattern: 'Custom', desc: 'Define your own pattern' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="font-medium text-orange-900">{item.pattern}</p>
                      <p className="text-sm text-orange-700">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Common Use Cases
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { case: 'HVAC Tune-Ups', schedule: 'Spring AC, Fall Heating' },
                    { case: 'Filter Changes', schedule: 'Monthly or quarterly' },
                    { case: 'Pool Service', schedule: 'Weekly maintenance' },
                    { case: 'Pest Control', schedule: 'Monthly treatments' },
                    { case: 'Lawn Care', schedule: 'Weekly mowing' },
                    { case: 'Fire Inspections', schedule: 'Annual compliance' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <p className="font-medium text-gray-900">{item.case}</p>
                      <p className="text-sm text-gray-600">{item.schedule}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Managing Recurring Jobs
                </h2>
                <p className="text-gray-600 mb-4">View and manage recurring jobs:</p>
                <div className="space-y-3">
                  {[
                    'Go to Jobs → Recurring',
                    'See all recurring job series',
                    'Edit the series or individual occurrences',
                    'Pause or cancel the series',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-orange-900 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Editing Options
                </h2>
                <p className="text-gray-600 mb-4">When editing a recurring job, choose:</p>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { option: 'This occurrence only', desc: 'Change just this instance', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                    { option: 'This and future', desc: 'Update going forward', color: 'bg-green-100 text-green-700 border-green-200' },
                    { option: 'All occurrences', desc: 'Update entire series', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                  ].map((item, i) => (
                    <div key={i} className={`p-4 rounded-lg border ${item.color}`}>
                      <p className="font-semibold">{item.option}</p>
                      <p className="text-sm opacity-80">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Auto-Assignment Options
                </h2>
                <p className="text-gray-600 mb-4">Configure how recurring jobs are assigned:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { method: 'Same Technician', desc: 'Always assign to the same tech' },
                    { method: 'Auto-Assign', desc: 'Let AI choose the best tech each time' },
                    { method: 'Rotate', desc: 'Cycle through a team of technicians' },
                    { method: 'Unassigned', desc: 'Create unassigned for manual dispatch' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                      <p className="font-medium text-gray-900">{item.method}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Notifications
                </h2>
                <p className="text-gray-600 mb-4">Set up reminders for recurring jobs:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    'Customer reminder before scheduled date',
                    'Confirmation request to customer',
                    'Alert if job not confirmed',
                    'Notification when job is created',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-700 text-sm">{item}</span>
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
                      Use recurring jobs with service agreements to build predictable revenue
                      and ensure regular customer touchpoints throughout the year.
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
