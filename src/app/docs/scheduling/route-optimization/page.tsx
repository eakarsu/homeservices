'use client'

import Link from 'next/link'
import { ArrowLeftIcon, MapIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function RouteOptimizationPage() {
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
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <MapIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Route Optimization</h1>
                  <p className="text-teal-100 mt-1">Reduce drive time and fuel costs with intelligent routing</p>
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
                    Route optimization automatically calculates the most efficient order for
                    technicians to visit their scheduled jobs, minimizing total travel time
                    and distance.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  How It Works
                </h2>
                <p className="text-gray-600 mb-4">The route optimizer considers multiple factors:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { factor: 'Location', desc: 'Geographic location of each job' },
                    { factor: 'Time Windows', desc: 'Scheduled time constraints' },
                    { factor: 'Traffic', desc: 'Real-time traffic conditions' },
                    { factor: 'Start Point', desc: 'Technician\'s starting location' },
                    { factor: 'Duration', desc: 'Estimated job duration' },
                    { factor: 'Availability', desc: 'Customer availability windows' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                      <p className="font-medium text-teal-900">{item.factor}</p>
                      <p className="text-sm text-teal-700">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Optimizing Routes
                </h2>
                <p className="text-gray-600 mb-4">To optimize a technician's route:</p>
                <div className="space-y-3">
                  {[
                    'Open the dispatch board',
                    'Select a technician\'s schedule',
                    'Click Optimize Route',
                    'Review the suggested order',
                    'Apply the optimization',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Batch Optimization
                </h2>
                <p className="text-gray-600 mb-4">Optimize routes for your entire team:</p>
                <div className="space-y-3">
                  {[
                    'Go to Dispatch → Route Optimization',
                    'Select the date to optimize',
                    'Choose which technicians to include',
                    'Click Optimize All Routes',
                    'Review and apply changes',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                      <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-teal-900 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Optimization Settings
                </h2>
                <p className="text-gray-600 mb-4">Configure optimization preferences in Settings:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { setting: 'Start Location', desc: 'Office, home, or first job' },
                    { setting: 'End Location', desc: 'Office, home, or last job' },
                    { setting: 'Buffer Time', desc: 'Minutes between jobs' },
                    { setting: 'Lunch Break', desc: 'Block time for breaks' },
                    { setting: 'Max Drive Time', desc: 'Limit total daily driving' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <p className="font-medium text-gray-900">{item.setting}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Traffic Integration
                </h2>
                <p className="text-gray-600 mb-4">ServiceCrew AI integrates with traffic data to provide:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    'Real-time traffic conditions',
                    'Historical traffic patterns',
                    'Predicted travel times',
                    'Alternative route suggestions',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Metrics & Savings
                </h2>
                <p className="text-gray-600 mb-4">Track your optimization results:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { metric: 'Miles Saved', desc: 'Per day/week/month' },
                    { metric: 'Drive Time', desc: 'Hours reduced' },
                    { metric: 'Fuel Costs', desc: 'Dollar savings' },
                    { metric: 'More Jobs', desc: 'Completed per day' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                      <p className="font-semibold text-green-900">{item.metric}</p>
                      <p className="text-sm text-green-700">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">Savings Example</h3>
                    <p className="text-green-800 text-sm">
                      A 5-technician team running 8 jobs each per day can save an average of
                      45 miles per technician daily. That's 225 miles per day, or over 50,000
                      miles per year — saving thousands in fuel and vehicle maintenance.
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
