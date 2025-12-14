'use client'

import Link from 'next/link'
import { ArrowLeftIcon, UserCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function AccountSetupPage() {
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
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <UserCircleIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Account Setup</h1>
                  <p className="text-indigo-100 mt-1">Configure your account for optimal performance</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Profile Settings
                </h2>
                <p className="text-gray-600 mb-4">Access your profile settings by clicking your avatar in the top right corner and selecting "Profile."</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: 'Profile Photo', desc: 'Upload a professional photo' },
                    { name: 'Contact Information', desc: 'Keep your email and phone updated' },
                    { name: 'Password', desc: 'Use a strong, unique password' },
                    { name: 'Two-Factor Auth', desc: 'Enable for extra security' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Notification Preferences
                </h2>
                <p className="text-gray-600 mb-4">Customize how and when you receive notifications:</p>
                <div className="space-y-2">
                  {[
                    { type: 'Email', desc: 'notifications for new jobs' },
                    { type: 'SMS', desc: 'alerts for urgent updates' },
                    { type: 'Push', desc: 'notifications on mobile' },
                    { type: 'Daily Summary', desc: 'emails with activity overview' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">{item.type}</span>
                      <span className="text-gray-600">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Time Zone & Localization
                </h2>
                <p className="text-gray-600 mb-4">Ensure your time zone is correctly set for accurate scheduling:</p>
                <div className="space-y-3">
                  {[
                    'Go to Settings → General',
                    'Select your time zone from the dropdown',
                    'Choose your preferred date format',
                    'Set your currency',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Connected Accounts
                </h2>
                <p className="text-gray-600 mb-4">Link external accounts for enhanced functionality:</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { name: 'Google Calendar', desc: 'Sync your schedule', icon: '📅' },
                    { name: 'QuickBooks', desc: 'Auto invoice syncing', icon: '📊' },
                    { name: 'Stripe', desc: 'Accept card payments', icon: '💳' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg text-center">
                      <span className="text-2xl">{item.icon}</span>
                      <p className="font-medium text-gray-900 mt-2">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Security Settings
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: 'Two-Factor Authentication', desc: 'Add an extra layer of security' },
                    { name: 'Active Sessions', desc: 'Review and manage logins' },
                    { name: 'Trusted Devices', desc: 'Manage recognized devices' },
                    { name: 'Login Alerts', desc: 'Get notified of new logins' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <ShieldCheckIcon className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Pro Tip</h3>
                    <p className="text-blue-800 text-sm">
                      Enable two-factor authentication to add an extra layer of security to your account.
                      This is especially important if you handle sensitive customer information.
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
