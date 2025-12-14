'use client'

import Link from 'next/link'
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function CreatingInvoicesPage() {
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
                  <DocumentTextIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Creating Invoices</h1>
                  <p className="text-green-100 mt-1">Generate professional invoices for your services</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Creating an Invoice
                </h2>
                <p className="text-gray-600 mb-4">Invoices can be created multiple ways:</p>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { method: 'From Job', desc: 'Automatically from completed job', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                    { method: 'From Estimate', desc: 'From an approved estimate', color: 'bg-green-100 text-green-700 border-green-200' },
                    { method: 'Manual', desc: 'Invoices → New Invoice', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                  ].map((item, i) => (
                    <div key={i} className={`p-4 rounded-lg border ${item.color}`}>
                      <p className="font-semibold">{item.method}</p>
                      <p className="text-sm opacity-80">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Invoice Details
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: 'Customer', desc: 'Select the billing customer' },
                    { name: 'Line Items', desc: 'Services, parts, and labor' },
                    { name: 'Taxes', desc: 'Automatic tax calculation' },
                    { name: 'Discounts', desc: 'Percentage or fixed discounts' },
                    { name: 'Notes', desc: 'Terms and payment instructions' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Invoice Numbering
                </h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700">
                    Invoices are automatically numbered sequentially. Customize the format in
                    <span className="font-medium text-gray-900"> Settings → Invoice Settings</span>.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Sending Invoices
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { method: 'Email', desc: 'Send directly to customer', icon: '📧' },
                    { method: 'SMS', desc: 'Text link to view invoice', icon: '📱' },
                    { method: 'Print', desc: 'Mail or hand delivery', icon: '🖨️' },
                    { method: 'Portal', desc: 'Customer portal access', icon: '🌐' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="font-medium text-green-900">{item.method}</p>
                        <p className="text-sm text-green-700">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Payment Terms
                </h2>
                <p className="text-gray-600 mb-4">Set default payment terms:</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    'Due on Receipt',
                    'Net 15',
                    'Net 30',
                    'Custom Terms',
                  ].map((term, i) => (
                    <div key={i} className="px-4 py-3 bg-gray-50 rounded-lg text-center font-medium text-gray-700">
                      {term}
                    </div>
                  ))}
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
                      Enable automatic invoicing in Settings to have invoices generated and sent
                      automatically when jobs are completed. This speeds up your cash flow significantly.
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
