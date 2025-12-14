'use client'

import Link from 'next/link'
import { ArrowLeftIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function AppInstallationPage() {
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
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <DevicePhoneMobileIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">App Installation</h1>
                  <p className="text-primary-100 mt-1">Download and set up the ServiceCrew AI mobile app</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Download the App
                </h2>
                <p className="text-gray-600 mb-4">The ServiceCrew AI mobile app is available for both iOS and Android:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">iOS</p>
                      <p className="text-sm text-gray-500">Download from App Store</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.523 2.047a.5.5 0 0 0-.27.073L3.91 10.702a1 1 0 0 0 0 1.696l13.344 8.582a.5.5 0 0 0 .77-.42V2.44a.5.5 0 0 0-.5-.393zM5.83 12l9.69-6.236v12.472L5.83 12z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Android</p>
                      <p className="text-sm text-gray-500">Download from Google Play</p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mt-4 text-sm">Search for "ServiceCrew AI" or use the links sent to your email.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  System Requirements
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: 'iOS', value: '14.0 or later' },
                    { label: 'Android', value: '8.0 or later' },
                    { label: 'Internet', value: 'WiFi or cellular' },
                    { label: 'GPS', value: 'Location services enabled' },
                    { label: 'Camera', value: 'For photo documentation' },
                  ].map((req, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">{req.label}:</span>
                      <span className="text-gray-600">{req.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  First-Time Setup
                </h2>
                <div className="space-y-3">
                  {[
                    'Open the app after installation',
                    'Enter your ServiceCrew AI email and password',
                    'Allow location permissions when prompted',
                    'Enable push notifications',
                    'Complete the quick tour',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Permissions Required
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: 'Location', desc: 'For GPS tracking and navigation', icon: '📍' },
                    { name: 'Camera', desc: 'For taking job photos', icon: '📷' },
                    { name: 'Notifications', desc: 'For job alerts and updates', icon: '🔔' },
                    { name: 'Storage', desc: 'For offline mode support', icon: '💾' },
                  ].map((perm, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{perm.icon}</span>
                        <span className="font-medium text-gray-900">{perm.name}</span>
                      </div>
                      <p className="text-sm text-gray-600">{perm.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Troubleshooting
                </h2>
                <div className="space-y-3">
                  {[
                    { q: "Can't log in?", a: 'Verify your credentials on the web app first' },
                    { q: 'No jobs showing?', a: 'Pull down to refresh and check your filters' },
                    { q: 'GPS not working?', a: 'Check location permissions in device settings' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="font-medium text-amber-900">{item.q}</p>
                      <p className="text-amber-800 text-sm mt-1">{item.a}</p>
                    </div>
                  ))}
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
