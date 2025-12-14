'use client'

import Link from 'next/link'
import { ArrowLeftIcon, SignalSlashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function OfflineModePage() {
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
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <SignalSlashIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Offline Mode</h1>
                  <p className="text-slate-200 mt-1">Work without internet and sync when back online</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  How Offline Mode Works
                </h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <p className="text-blue-800">
                    ServiceCrew AI automatically caches your jobs and data so you can work in areas with poor connectivity.
                    Changes are stored locally and synced automatically when you're back online.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Offline Capabilities
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                      <CheckIcon className="w-5 h-5" />
                      Works Offline
                    </h3>
                    <div className="space-y-2">
                      {[
                        'View scheduled jobs',
                        'Access customer information',
                        'Complete job forms',
                        'Take photos',
                        'Capture signatures',
                        'View pricebook',
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-800 text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                      <XMarkIcon className="w-5 h-5" />
                      Requires Internet
                    </h3>
                    <div className="space-y-2">
                      {[
                        'Processing payments',
                        'Sending emails/SMS',
                        'Real-time GPS updates',
                        'Creating new customers',
                        'Downloading new jobs',
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-red-800 text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Syncing Data
                </h2>
                <p className="text-gray-600 mb-4">When you regain connectivity:</p>
                <div className="space-y-3">
                  {[
                    { step: 'Detect Connection', desc: 'App automatically detects when online' },
                    { step: 'Upload Changes', desc: 'Queued changes sync to server' },
                    { step: 'Download Updates', desc: 'New data downloads to device' },
                    { step: 'Confirm Complete', desc: 'Confirmation shown when synced' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
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
                  Enabling Offline Mode
                </h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <p className="font-medium text-amber-900 mb-3">Setup Steps:</p>
                  <div className="space-y-2">
                    {[
                      'Go to app Settings',
                      'Enable "Offline Mode"',
                      'Choose how much data to cache',
                      'Sync before going into low-coverage areas',
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
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
