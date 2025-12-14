'use client'

import Link from 'next/link'
import { ArrowLeftIcon, BookOpenIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function PricebookPage() {
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
            <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <BookOpenIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Pricebook Setup</h1>
                  <p className="text-violet-100 mt-1">Configure flat-rate pricing for consistent quoting</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  What is a Pricebook?
                </h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700">
                    A pricebook is your catalog of services and parts with pre-set pricing, ensuring
                    consistent quotes across your team. Technicians can quickly add items without
                    manual price calculations.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Creating Pricebook Items
                </h2>
                <div className="space-y-3">
                  {[
                    'Go to Settings → Pricebook',
                    'Click Add Item',
                    'Enter name, description, and price',
                    'Assign to a category',
                    'Save',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Item Types
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { type: 'Service', desc: 'Labor and service charges', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                    { type: 'Part', desc: 'Materials and equipment', color: 'bg-green-100 text-green-700 border-green-200' },
                    { type: 'Package', desc: 'Bundled services', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                  ].map((item, i) => (
                    <div key={i} className={`p-5 rounded-xl border ${item.color}`}>
                      <p className="text-lg font-bold mb-1">{item.type}</p>
                      <p className="text-sm opacity-80">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Pricing Strategies
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { strategy: 'Flat Rate', desc: 'Fixed price regardless of time' },
                    { strategy: 'Hourly', desc: 'Rate × hours worked' },
                    { strategy: 'Tiered', desc: 'Good/Better/Best options' },
                    { strategy: 'By Unit', desc: 'Per foot, per square, etc.' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
                      <p className="font-medium text-violet-900">{item.strategy}</p>
                      <p className="text-sm text-violet-700">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Categories
                </h2>
                <p className="text-gray-600 mb-4">Organize your pricebook by category:</p>
                <div className="flex flex-wrap gap-3">
                  {['HVAC', 'Plumbing', 'Electrical', 'General', 'Maintenance', 'Emergency'].map((cat, i) => (
                    <span key={i} className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 font-medium">
                      {cat}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Using in the Field
                </h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-green-900 mb-2">Mobile Access</p>
                      <p className="text-green-800 text-sm">
                        Technicians can quickly add pricebook items to jobs and estimates from the mobile app.
                        Search by name or browse categories for fast selection.
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
                      Create Good/Better/Best options for your common services. This gives customers choice
                      while increasing your average ticket value through upselling.
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
