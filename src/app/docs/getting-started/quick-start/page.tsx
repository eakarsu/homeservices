'use client'

import Link from 'next/link'
import { ArrowLeftIcon, RocketLaunchIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function QuickStartPage() {
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
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <RocketLaunchIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Quick Start Guide</h1>
                  <p className="text-primary-100 mt-1">Get up and running in under 15 minutes</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Step 1: Create Your Account
                </h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 mb-4">
                    Visit <Link href="/register" className="text-primary-600 hover:text-primary-500 font-medium">servicecrewai.com/register</Link> and sign up with your email address.
                  </p>
                  <p className="text-gray-600 text-sm">
                    You'll receive a confirmation email to verify your account.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Step 2: Set Up Your Company
                </h2>
                <p className="text-gray-600 mb-4">After logging in, you'll be prompted to enter your company details:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    'Company name and address',
                    'Business phone number',
                    'Service area / coverage zones',
                    'Business hours',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Step 3: Add Your Team
                </h2>
                <p className="text-gray-600 mb-4">Navigate to <span className="font-medium text-gray-900">Settings → Team Members</span> to add your staff:</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { role: 'Admins', desc: 'Full access to all features', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                    { role: 'Dispatchers', desc: 'Schedule and assign jobs', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                    { role: 'Technicians', desc: 'View and complete jobs', color: 'bg-green-100 text-green-700 border-green-200' },
                  ].map((item, i) => (
                    <div key={i} className={`p-4 rounded-lg border ${item.color}`}>
                      <p className="font-semibold">{item.role}</p>
                      <p className="text-sm opacity-80">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Step 4: Configure Your Services
                </h2>
                <p className="text-gray-600 mb-4">Go to <span className="font-medium text-gray-900">Settings → Service Types</span> to define the services you offer:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Service name', desc: 'and description' },
                    { label: 'Default duration', desc: 'for scheduling' },
                    { label: 'Base pricing', desc: 'for estimates' },
                    { label: 'Required skills', desc: 'for technicians' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <span className="font-medium text-gray-900">{item.label}</span>
                      <span className="text-gray-500"> {item.desc}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Step 5: Create Your First Job
                </h2>
                <p className="text-gray-600 mb-4">Click <span className="font-medium text-gray-900">+ New Job</span> from the dashboard:</p>
                <div className="space-y-3">
                  {[
                    'Select or create a customer',
                    'Choose the service type',
                    'Set the scheduled date and time',
                    'Assign a technician',
                    'Save and dispatch',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">You're all set!</h3>
                    <p className="text-green-800 text-sm">
                      Your technician will receive a notification about their new job. They can view
                      job details, navigate to the location, and complete the job from the mobile app.
                    </p>
                  </div>
                </div>
              </div>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Next Steps
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { title: 'Account Setup', href: '/docs/getting-started/account-setup', desc: 'Complete your profile' },
                    { title: 'Pricebook', href: '/docs/invoicing/pricebook', desc: 'Set up pricing' },
                    { title: 'Mobile App', href: '/docs/mobile/installation', desc: 'Install the app' },
                  ].map((item, i) => (
                    <Link key={i} href={item.href} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all group">
                      <p className="font-medium text-gray-900 group-hover:text-primary-600">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </Link>
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
