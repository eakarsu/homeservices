'use client'

import Link from 'next/link'
import { ArrowLeftIcon, CameraIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function PhotoDocumentationPage() {
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
                  <CameraIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Photo Documentation</h1>
                  <p className="text-purple-100 mt-1">Capture and organize job photos for records</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Taking Photos
                </h2>
                <div className="space-y-3">
                  {[
                    'Open the job in the mobile app',
                    'Tap the camera icon or "Add Photo"',
                    'Take a photo or select from gallery',
                    'Add a caption describing the photo',
                    'Save to the job record',
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
                  Photo Categories
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Before', desc: 'Document condition before work', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                    { name: 'During', desc: 'Work in progress', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                    { name: 'After', desc: 'Completed work', color: 'bg-green-100 text-green-700 border-green-200' },
                    { name: 'Issue', desc: 'Problems found', color: 'bg-red-100 text-red-700 border-red-200' },
                    { name: 'Equipment', desc: 'Model/serial plates', color: 'bg-gray-100 text-gray-700 border-gray-200' },
                  ].map((cat, i) => (
                    <div key={i} className={`p-4 rounded-lg border ${cat.color}`}>
                      <p className="font-semibold">{cat.name}</p>
                      <p className="text-sm opacity-80">{cat.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Best Practices
                </h2>
                <div className="space-y-3">
                  {[
                    { tip: 'Take before and after photos for every job', icon: '📸' },
                    { tip: 'Document any existing damage before starting', icon: '⚠️' },
                    { tip: 'Capture equipment labels and serial numbers', icon: '🏷️' },
                    { tip: 'Add clear captions for context', icon: '✏️' },
                    { tip: 'Ensure good lighting for clear images', icon: '💡' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <span className="text-xl">{item.icon}</span>
                      <p className="text-purple-900">{item.tip}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Photo Storage
                </h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 mb-2">Automatic Cloud Sync</p>
                      <p className="text-blue-800 text-sm">
                        All photos are automatically synced to the cloud and attached to the job record.
                        Access them anytime from the web app or mobile device.
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
