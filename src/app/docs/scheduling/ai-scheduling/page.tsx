'use client'

import Link from 'next/link'
import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function AISchedulingPage() {
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
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">AI Scheduling</h1>
                  <p className="text-purple-100 mt-1">Let AI optimize your scheduling for maximum efficiency</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  How AI Scheduling Works
                </h2>
                <p className="text-gray-600 mb-4">ServiceCrew AI uses machine learning to analyze multiple factors and suggest optimal scheduling decisions:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { factor: 'Skills', desc: 'Technician skills and certifications' },
                    { factor: 'Location', desc: 'Geographic location and travel time' },
                    { factor: 'Capacity', desc: 'Current workload and capacity' },
                    { factor: 'History', desc: 'Customer history and preferences' },
                    { factor: 'Priority', desc: 'Job priority and SLA requirements' },
                    { factor: 'Parts', desc: 'Equipment and parts availability' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="font-medium text-purple-900">{item.factor}</p>
                      <p className="text-sm text-purple-700">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  AI-Suggested Assignments
                </h2>
                <p className="text-gray-600 mb-4">When creating or editing a job:</p>
                <div className="space-y-3">
                  {[
                    'Click Suggest Technician',
                    'AI analyzes available technicians',
                    'Review the recommendation with reasoning',
                    'Accept or choose a different technician',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Smart Time Slots
                </h2>
                <p className="text-gray-600 mb-4">AI can suggest optimal time slots based on:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    'Technician availability windows',
                    'Travel time from previous job',
                    'Customer\'s preferred times',
                    'Job priority level',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Auto-Optimization
                </h2>
                <p className="text-gray-600 mb-4">Enable auto-optimization to let AI continuously improve your schedule:</p>
                <div className="space-y-3">
                  {[
                    'Go to Settings → AI Features',
                    'Enable Schedule Auto-Optimization',
                    'Set optimization frequency (hourly, daily)',
                    'Choose optimization priorities',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-purple-900 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Optimization Goals
                </h2>
                <p className="text-gray-600 mb-4">Configure what the AI should prioritize:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { goal: 'Minimize Travel Time', desc: 'Reduce driving between jobs' },
                    { goal: 'Balance Workload', desc: 'Even distribution across techs' },
                    { goal: 'Maximize Revenue', desc: 'Prioritize high-value jobs' },
                    { goal: 'Customer Satisfaction', desc: 'Match preferred techs' },
                    { goal: 'Skills Match', desc: 'Best qualified technician' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                      <p className="font-medium text-gray-900">{item.goal}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Predictive Insights
                </h2>
                <p className="text-gray-600 mb-4">AI provides predictions to help planning:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { insight: 'Job Completion', desc: 'Estimated completion times' },
                    { insight: 'Running Late', desc: 'Likelihood of delays' },
                    { insight: 'Buffer Times', desc: 'Suggested buffer periods' },
                    { insight: 'Capacity', desc: 'Workload forecasting' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="font-medium text-amber-900">{item.insight}</p>
                      <p className="text-sm text-amber-700">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <SparklesIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-1">AI Learning</h3>
                    <p className="text-purple-800 text-sm">
                      The more you use ServiceCrew AI, the smarter it gets. The AI learns from
                      your scheduling patterns, job outcomes, and customer feedback to improve
                      recommendations over time.
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
