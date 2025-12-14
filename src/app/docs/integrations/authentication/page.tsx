'use client'

import Link from 'next/link'
import { ArrowLeftIcon, KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function AuthenticationPage() {
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
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <KeyIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">API Authentication</h1>
                  <p className="text-slate-200 mt-1">Secure your API requests with proper authentication</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  API Keys
                </h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700">
                    All API requests require authentication using an API key.
                    API keys identify your application and authenticate requests to the ServiceCrew AI API.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Generating API Keys
                </h2>
                <div className="space-y-3">
                  {[
                    'Go to Settings → API',
                    'Click "Generate New Key"',
                    'Name your key (e.g., "Production App")',
                    'Copy and securely store the key',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Using Your API Key
                </h2>
                <p className="text-gray-600 mb-4">Include the key in the Authorization header:</p>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-green-400 font-mono text-sm">Authorization: Bearer YOUR_API_KEY</code>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Security Best Practices
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { practice: 'Never expose in client-side code', desc: 'Keep keys server-side only', icon: '🔒' },
                    { practice: 'Use environment variables', desc: 'Store in .env files', icon: '📁' },
                    { practice: 'Rotate keys periodically', desc: 'Change keys regularly', icon: '🔄' },
                    { practice: 'Separate dev/prod keys', desc: 'Different keys per environment', icon: '🔑' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className="font-medium text-slate-900">{item.practice}</p>
                        <p className="text-sm text-slate-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Rate Limits
                </h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-amber-900 mb-2">100 Requests Per Minute</p>
                      <p className="text-amber-800 text-sm">
                        API requests are limited to 100 requests per minute per key.
                        Contact support for higher limits if needed.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Security Note</h3>
                    <p className="text-blue-800 text-sm">
                      If you believe your API key has been compromised, immediately revoke it in Settings → API
                      and generate a new one. All requests with the old key will be rejected.
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
