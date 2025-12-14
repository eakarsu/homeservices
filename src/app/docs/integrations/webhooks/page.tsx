'use client'

import Link from 'next/link'
import { ArrowLeftIcon, BoltIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function WebhooksPage() {
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
                  <BoltIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Webhooks</h1>
                  <p className="text-orange-100 mt-1">Receive real-time notifications when events occur</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  What are Webhooks?
                </h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700">
                    Webhooks send HTTP POST requests to your server when events happen in ServiceCrew AI.
                    Use them to sync data, trigger automations, or notify external systems in real-time.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Available Events
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { event: 'job.created', desc: 'New job created' },
                    { event: 'job.updated', desc: 'Job details changed' },
                    { event: 'job.completed', desc: 'Job marked complete' },
                    { event: 'invoice.created', desc: 'New invoice generated' },
                    { event: 'invoice.paid', desc: 'Payment received' },
                    { event: 'customer.created', desc: 'New customer added' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <code className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm font-mono">{item.event}</code>
                      <span className="text-gray-600">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Setting Up Webhooks
                </h2>
                <div className="space-y-3">
                  {[
                    'Go to Settings → Webhooks',
                    'Click "Add Endpoint"',
                    'Enter your endpoint URL',
                    'Select events to subscribe to',
                    'Save and test',
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
                  Webhook Payload
                </h2>
                <p className="text-gray-600 mb-4">Each webhook includes event type, timestamp, and relevant data in JSON format:</p>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 font-mono text-sm">{`{
  "event": "job.completed",
  "timestamp": "2025-01-15T14:30:00Z",
  "data": {
    "job_id": "job_123abc",
    "customer_id": "cust_456def",
    "status": "completed",
    ...
  }
}`}</pre>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Retry Policy
                </h2>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-orange-900 mb-2">Automatic Retries</p>
                      <p className="text-orange-800 text-sm">
                        Failed webhooks are retried up to 5 times with exponential backoff.
                        If your endpoint returns a non-2xx status code, we'll retry the delivery.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Verification
                </h2>
                <p className="text-gray-600 mb-4">Verify webhook authenticity using the signature header:</p>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-green-400 font-mono text-sm">X-ServiceCrew-Signature: sha256=abc123...</code>
                </div>
              </section>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BoltIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Pro Tip</h3>
                    <p className="text-blue-800 text-sm">
                      Use webhook logs in Settings → Webhooks to debug delivery issues.
                      You can see the request payload, response status, and retry attempts.
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
