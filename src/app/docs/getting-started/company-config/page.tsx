'use client'

import Link from 'next/link'
import { ArrowLeftIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function CompanyConfigPage() {
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
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <BuildingOfficeIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Company Configuration</h1>
                  <p className="text-teal-100 mt-1">Set up your company profile and business settings</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Company Profile
                </h2>
                <p className="text-gray-600 mb-4">Navigate to <span className="font-medium text-gray-900">Settings → Company</span> to configure your business information:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: 'Company Name', desc: 'Your official business name' },
                    { name: 'Logo', desc: 'Upload logo (appears on invoices)' },
                    { name: 'Address', desc: 'Primary business address' },
                    { name: 'Phone & Email', desc: 'Contact information' },
                    { name: 'Website', desc: 'Your company website URL' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Business Hours
                </h2>
                <p className="text-gray-600 mb-4">Define your operating hours for each day of the week:</p>
                <div className="space-y-3">
                  {[
                    'Go to Settings → Business Hours',
                    'Set start and end times for each day',
                    'Mark days as closed if applicable',
                    'Add special hours for holidays',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Service Areas
                </h2>
                <p className="text-gray-600 mb-4">Define the geographic areas you serve:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: 'ZIP Codes', desc: 'Add ZIP codes or cities you service' },
                    { label: 'Zone Pricing', desc: 'Set different pricing for different zones' },
                    { label: 'Travel Time', desc: 'Configure travel time estimates' },
                    { label: 'Out-of-Area Fees', desc: 'Set up fees for distant locations' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      <div>
                        <span className="font-medium text-gray-900">{item.label}</span>
                        <span className="text-gray-600 text-sm"> - {item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Tax Settings
                </h2>
                <p className="text-gray-600 mb-4">Configure tax rates for your services:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: 'Default Tax Rate', desc: 'Standard rate applied to invoices' },
                    { name: 'Tax-Exempt Services', desc: 'Mark services as non-taxable' },
                    { name: 'Multi-Jurisdiction', desc: 'Different rates by location' },
                    { name: 'Tax ID / EIN', desc: 'Your business tax number' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Invoice Settings
                </h2>
                <p className="text-gray-600 mb-4">Customize your invoices:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: 'Invoice Format', desc: 'Number prefix and format' },
                    { name: 'Payment Terms', desc: 'Net 15, Net 30, etc.' },
                    { name: 'Late Fees', desc: 'Late payment penalties' },
                    { name: 'Default Notes', desc: 'Standard terms and notes' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 transition-colors">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Branding
                </h2>
                <p className="text-gray-600 mb-4">Customize the look of customer-facing documents:</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: 'Brand Color', icon: '🎨' },
                    { name: 'Invoice Template', icon: '📄' },
                    { name: 'Email Templates', icon: '📧' },
                    { name: 'Customer Portal', icon: '🌐' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-teal-50 border border-teal-200 rounded-lg text-center">
                      <span className="text-2xl">{item.icon}</span>
                      <p className="font-medium text-teal-900 mt-2 text-sm">{item.name}</p>
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
