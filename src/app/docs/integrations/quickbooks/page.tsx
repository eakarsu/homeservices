'use client'

import Link from 'next/link'
import { ArrowLeftIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function QuickBooksPage() {
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
                  <ArrowsRightLeftIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">QuickBooks Integration</h1>
                  <p className="text-green-100 mt-1">Sync invoices and customers with QuickBooks Online</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Connecting QuickBooks
                </h2>
                <div className="space-y-3">
                  {[
                    'Go to Settings → Integrations',
                    'Click "Connect QuickBooks"',
                    'Sign in to your QuickBooks account',
                    'Authorize the connection',
                    'Configure sync settings',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  What Syncs
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { item: 'Customers', desc: 'Two-way sync of customer records', icon: '👥' },
                    { item: 'Invoices', desc: 'Push invoices to QuickBooks', icon: '📄' },
                    { item: 'Payments', desc: 'Sync payment records', icon: '💳' },
                    { item: 'Products/Services', desc: 'Sync pricebook items', icon: '📦' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="font-medium text-green-900">{item.item}</p>
                        <p className="text-sm text-green-700">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Sync Settings
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { setting: 'Sync Mode', desc: 'Automatic or manual sync' },
                    { setting: 'Frequency', desc: 'Real-time, hourly, or daily' },
                    { setting: 'Conflict Resolution', desc: 'Rules for data conflicts' },
                    { setting: 'Account Mapping', desc: 'Map to QBO accounts' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                      <p className="font-medium text-gray-900">{item.setting}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Sync Direction
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-semibold text-blue-900 mb-2">ServiceCrew → QuickBooks</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• New invoices</li>
                      <li>• Payment records</li>
                      <li>• New customers</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="font-semibold text-purple-900 mb-2">QuickBooks → ServiceCrew</p>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Customer updates</li>
                      <li>• Payment status</li>
                      <li>• Account balances</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Troubleshooting
                </h2>
                <div className="space-y-3">
                  {[
                    { issue: 'Connection failed?', fix: 'Check connection status in Settings' },
                    { issue: 'Sync errors?', fix: 'Review sync logs for details' },
                    { issue: 'Auth expired?', fix: 'Re-authorize the connection' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="font-medium text-amber-900">{item.issue}</p>
                      <p className="text-amber-800 text-sm mt-1">{item.fix}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ArrowsRightLeftIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Pro Tip</h3>
                    <p className="text-blue-800 text-sm">
                      Enable real-time sync to keep your books always up to date. This eliminates
                      end-of-day data entry and ensures your financial reports are always accurate.
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
