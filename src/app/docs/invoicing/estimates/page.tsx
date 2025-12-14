'use client'

import Link from 'next/link'
import { ArrowLeftIcon, CalculatorIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function EstimatesPage() {
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
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <CalculatorIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Estimates & Quotes</h1>
                  <p className="text-amber-100 mt-1">Create professional estimates with Good/Better/Best options</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Creating Estimates
                </h2>
                <div className="space-y-3">
                  {[
                    'Click Estimates → New Estimate',
                    'Select the customer',
                    'Add line items and options',
                    'Set expiration date',
                    'Send to customer',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Good/Better/Best Pricing
                </h2>
                <p className="text-gray-600 mb-4">Present customers with tiered options:</p>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { tier: 'Good', desc: 'Basic solution, lowest cost', color: 'bg-gray-100 text-gray-700 border-gray-300' },
                    { tier: 'Better', desc: 'Mid-range with more features', color: 'bg-blue-100 text-blue-700 border-blue-300' },
                    { tier: 'Best', desc: 'Premium option, full solution', color: 'bg-amber-100 text-amber-700 border-amber-300' },
                  ].map((item, i) => (
                    <div key={i} className={`p-5 rounded-xl border-2 ${item.color}`}>
                      <p className="text-lg font-bold mb-1">{item.tier}</p>
                      <p className="text-sm opacity-80">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Estimate Options
                </h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <p className="text-amber-800">
                    Create multiple options within one estimate to give customers choices.
                    They can compare options side-by-side and select the one that fits their needs and budget.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Customer Approval
                </h2>
                <div className="space-y-3">
                  {[
                    { step: 'Email Sent', desc: 'Customer receives estimate link' },
                    { step: 'Review', desc: 'They review and select an option' },
                    { step: 'Sign', desc: 'Digital signature to approve' },
                    { step: 'Auto-Convert', desc: 'Estimate converts to job automatically' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="pt-1">
                        <p className="font-medium text-amber-900">{item.step}</p>
                        <p className="text-sm text-amber-700">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Estimate to Invoice
                </h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-green-900 mb-2">One-Click Conversion</p>
                      <p className="text-green-800 text-sm">
                        Approved estimates can be converted to invoices with one click after work is complete.
                        All line items and pricing carry over automatically.
                      </p>
                    </div>
                  </div>
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
                      Use Good/Better/Best options to increase your average ticket size.
                      Studies show that customers often choose the middle option when presented with three choices.
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
