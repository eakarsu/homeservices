'use client'

import Link from 'next/link'
import { ArrowLeftIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function PaymentProcessingPage() {
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
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <CreditCardIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Payment Processing</h1>
                  <p className="text-blue-100 mt-1">Accept payments and get paid faster</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Payment Methods
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { method: 'Credit/Debit Cards', desc: 'Visa, Mastercard, Amex, Discover', icon: '💳' },
                    { method: 'ACH/Bank Transfer', desc: 'Direct bank payments', icon: '🏦' },
                    { method: 'Cash', desc: 'Record cash payments', icon: '💵' },
                    { method: 'Check', desc: 'Record check payments', icon: '📝' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="font-medium text-blue-900">{item.method}</p>
                        <p className="text-sm text-blue-700">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Setting Up Payments
                </h2>
                <div className="space-y-3">
                  {[
                    'Go to Settings → Payments',
                    'Connect your Stripe account',
                    'Configure processing fees',
                    'Set up bank account for deposits',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Collecting Payments
                </h2>
                <p className="text-gray-600 mb-4">Accept payments from:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { source: 'Mobile App', desc: 'Collect in the field' },
                    { source: 'Invoice Email Link', desc: 'Pay online via link' },
                    { source: 'Customer Portal', desc: 'Self-service payment' },
                    { source: 'Office Dashboard', desc: 'Process in-office' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <p className="font-medium text-gray-900">{item.source}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Deposits & Payouts
                </h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-green-900 mb-2">Fast Deposits</p>
                      <p className="text-green-800 text-sm">
                        Funds are deposited to your bank account on a rolling basis,
                        typically 2 business days after payment is received.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Payment Reports
                </h2>
                <p className="text-gray-600 mb-4">Track all payments in Reports → Payments with filtering by:</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {['Date Range', 'Payment Method', 'Status'].map((filter, i) => (
                    <div key={i} className="px-4 py-3 bg-gray-50 rounded-lg text-center font-medium text-gray-700">
                      {filter}
                    </div>
                  ))}
                </div>
              </section>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCardIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Pro Tip</h3>
                    <p className="text-blue-800 text-sm">
                      Enable credit card on file for repeat customers. This allows for seamless
                      payment processing and reduces time spent chasing payments.
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
