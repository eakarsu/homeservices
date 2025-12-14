'use client'

import Link from 'next/link'
import { ArrowLeftIcon, PlusCircleIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function CreatingJobsPage() {
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
                  <PlusCircleIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Creating Jobs</h1>
                  <p className="text-blue-100 mt-1">Learn how to create and manage service jobs</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Creating a New Job
                </h2>
                <p className="text-gray-600 mb-4">There are several ways to create a new job:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    'Click the + New Job button in the header',
                    'From the Dashboard, click Create Job',
                    'From a customer profile, click Add Job',
                    'From the dispatch board, click on a time slot',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Customer Details
                </h2>
                <div className="space-y-3">
                  {[
                    { label: 'Select Customer', desc: 'Choose existing or create new' },
                    { label: 'Service Address', desc: 'Customers can have multiple properties' },
                    { label: 'Contact Info', desc: 'Verify phone and email' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Service Information
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: 'Service Type', desc: 'What type of work is being done' },
                    { name: 'Description', desc: 'Detailed description of the issue' },
                    { name: 'Priority', desc: 'Normal, High, or Emergency' },
                    { name: 'Est. Duration', desc: 'How long the job should take' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Job Types
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { type: 'Service Call', desc: 'Standard appointment', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                    { type: 'Repair', desc: 'Fix an existing issue', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                    { type: 'Installation', desc: 'Install new equipment', color: 'bg-green-100 text-green-700 border-green-200' },
                    { type: 'Maintenance', desc: 'Routine maintenance', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                    { type: 'Inspection', desc: 'Safety/quality check', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                    { type: 'Estimate', desc: 'On-site quote', color: 'bg-gray-100 text-gray-700 border-gray-200' },
                  ].map((item, i) => (
                    <div key={i} className={`p-4 rounded-lg border ${item.color}`}>
                      <p className="font-semibold">{item.type}</p>
                      <p className="text-sm opacity-80">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Scheduling
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { name: 'Date', desc: 'When the job should be performed' },
                    { name: 'Time Window', desc: 'Arrival range (e.g., 9am-12pm)' },
                    { name: 'Technician', desc: 'Who will perform the work' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-blue-900">{item.name}</p>
                      <p className="text-sm text-blue-700">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Adding Equipment
                </h2>
                <p className="text-gray-600 mb-4">Link equipment to the job for better tracking:</p>
                <div className="space-y-3">
                  {[
                    'Click Add Equipment in the job form',
                    'Select existing equipment or add new',
                    'Record model numbers, serial numbers, and warranty info',
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
                  Attachments
                </h2>
                <p className="text-gray-600 mb-4">Add relevant files to the job:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { name: 'Photos', desc: 'of the issue' },
                    { name: 'Equipment manuals', desc: 'for reference' },
                    { name: 'Previous records', desc: 'service history' },
                    { name: 'Customer docs', desc: 'provided files' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <span className="text-gray-600 text-sm">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-1">Best Practice</h3>
                    <p className="text-amber-800 text-sm">
                      Always add detailed notes about the customer's issue. This helps technicians
                      arrive prepared and reduces the need for follow-up questions.
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
