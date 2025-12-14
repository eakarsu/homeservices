'use client'

import Link from 'next/link'
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function JobCompletionPage() {
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
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <CheckCircleIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Job Completion</h1>
                  <p className="text-green-100 mt-1">Complete jobs efficiently from the mobile app</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Job Workflow
                </h2>
                <div className="space-y-3">
                  {[
                    { step: 'View Job', desc: 'Review job details and customer info' },
                    { step: 'Navigate', desc: 'Tap address to open maps' },
                    { step: 'Start Job', desc: 'Mark yourself "On Site"' },
                    { step: 'Work', desc: 'Complete service, add notes/photos' },
                    { step: 'Add Items', desc: 'Parts, labor, services' },
                    { step: 'Complete', desc: 'Get signature and payment' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="pt-1">
                        <p className="font-medium text-gray-900">{item.step}</p>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Adding Work Items
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: 'Labor Hours', desc: 'Track time spent on the job' },
                    { name: 'Parts', desc: 'Add parts from inventory' },
                    { name: 'Flat-Rate Pricing', desc: 'Apply pricing from pricebook' },
                    { name: 'Custom Items', desc: 'Add custom line items' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                      <p className="text-sm text-gray-600 ml-4">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Completing the Job
                </h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="space-y-3">
                    {[
                      'Review all charges for accuracy',
                      'Add completion notes describing work done',
                      'Capture customer signature on device',
                      'Process payment (optional)',
                      'Email receipt to customer',
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {i + 1}
                        </div>
                        <span className="text-green-900">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Customer Signature
                </h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 mb-2">Digital Signature Capture</p>
                      <p className="text-blue-800 text-sm">
                        Have the customer sign directly on the device screen to confirm work completion.
                        The signature is saved with a timestamp and attached to the job record.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
