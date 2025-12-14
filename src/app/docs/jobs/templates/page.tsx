'use client'

import Link from 'next/link'
import { ArrowLeftIcon, DocumentDuplicateIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function JobTemplatesPage() {
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
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <DocumentDuplicateIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Job Templates</h1>
                  <p className="text-rose-100 mt-1">Create reusable templates for common job types</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  What Are Job Templates?
                </h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700">
                    Job templates are pre-configured job setups that you can reuse for common
                    service types. They save time by pre-filling job details, checklists, and
                    pricing information.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Creating a Template
                </h2>
                <p className="text-gray-600 mb-4">Go to <span className="font-medium text-gray-900">Settings → Job Templates</span> and click <span className="font-medium text-gray-900">Create Template</span>:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: 'Template Name', desc: 'e.g., "AC Tune-Up"' },
                    { name: 'Service Type', desc: 'Category of service' },
                    { name: 'Default Duration', desc: 'Estimated time' },
                    { name: 'Description', desc: 'Standard job description' },
                    { name: 'Checklist', desc: 'Steps for technicians' },
                    { name: 'Default Pricing', desc: 'Standard charges' },
                    { name: 'Required Skills', desc: 'Tech qualifications needed' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg hover:border-rose-300 transition-colors">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Template Checklists
                </h2>
                <p className="text-gray-600 mb-4">Add standardized checklists to ensure consistent service:</p>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {[
                    'Pre-job inspection items',
                    'Service steps to complete',
                    'Post-job verification checks',
                    'Safety compliance items',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-lg p-6">
                  <p className="font-medium text-rose-900 mb-4">Example: AC Tune-Up Checklist</p>
                  <div className="space-y-2">
                    {[
                      'Check thermostat operation',
                      'Inspect and replace air filter',
                      'Clean condenser coils',
                      'Check refrigerant levels',
                      'Inspect electrical connections',
                      'Test system operation',
                      'Document readings and findings',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-white rounded border border-rose-100">
                        <CheckCircleIcon className="h-5 w-5 text-rose-400" />
                        <span className="text-rose-900 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Using Templates
                </h2>
                <p className="text-gray-600 mb-4">To create a job from a template:</p>
                <div className="space-y-3">
                  {[
                    'Click + New Job',
                    'Click Use Template',
                    'Select the template',
                    'Add customer and scheduling information',
                    'Modify any pre-filled details if needed',
                    'Save the job',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Template Categories
                </h2>
                <p className="text-gray-600 mb-4">Organize templates by service category:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { cat: 'HVAC', examples: 'AC repair, furnace tune-up, installation', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                    { cat: 'Plumbing', examples: 'Drain cleaning, water heater, faucet', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
                    { cat: 'Electrical', examples: 'Panel upgrade, outlet install, lighting', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                    { cat: 'Maintenance', examples: 'Seasonal tune-ups, inspections', color: 'bg-green-100 text-green-700 border-green-200' },
                  ].map((item, i) => (
                    <div key={i} className={`p-4 rounded-lg border ${item.color}`}>
                      <p className="font-semibold">{item.cat}</p>
                      <p className="text-sm opacity-80">{item.examples}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Template Pricing
                </h2>
                <p className="text-gray-600 mb-4">Set default pricing on templates:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: 'Flat Rate', desc: 'Fixed pricing for the service' },
                    { name: 'Hourly Rates', desc: 'With minimum hours' },
                    { name: 'Add-on Services', desc: 'Optional materials' },
                    { name: 'Tiered Options', desc: 'Good/Better/Best pricing' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
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
                      Create templates for your most common jobs. A well-designed template can
                      reduce job creation time by 80% and ensure consistent service delivery.
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
