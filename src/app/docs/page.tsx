'use client'

import Link from 'next/link'
import { BookOpenIcon, CodeBracketIcon, CogIcon, DevicePhoneMobileIcon, CurrencyDollarIcon, UsersIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

const docSections = [
  {
    title: 'Getting Started',
    icon: BookOpenIcon,
    description: 'Learn the basics of ServiceCrew AI',
    links: [
      { name: 'Quick Start Guide', href: '/docs/getting-started/quick-start' },
      { name: 'Account Setup', href: '/docs/getting-started/account-setup' },
      { name: 'Company Configuration', href: '/docs/getting-started/company-config' },
      { name: 'User Roles & Permissions', href: '/docs/getting-started/roles' },
    ],
  },
  {
    title: 'Job Management',
    icon: CogIcon,
    description: 'Managing jobs from creation to completion',
    links: [
      { name: 'Creating Jobs', href: '/docs/jobs/creating' },
      { name: 'Job Statuses', href: '/docs/jobs/statuses' },
      { name: 'Assigning Technicians', href: '/docs/jobs/assigning' },
      { name: 'Job Templates', href: '/docs/jobs/templates' },
    ],
  },
  {
    title: 'Scheduling & Dispatch',
    icon: UsersIcon,
    description: 'Optimize your team\'s schedule',
    links: [
      { name: 'Dispatch Board', href: '/docs/scheduling/dispatch-board' },
      { name: 'AI Scheduling', href: '/docs/scheduling/ai-scheduling' },
      { name: 'Route Optimization', href: '/docs/scheduling/route-optimization' },
      { name: 'Recurring Jobs', href: '/docs/scheduling/recurring-jobs' },
    ],
  },
  {
    title: 'Mobile App',
    icon: DevicePhoneMobileIcon,
    description: 'Using ServiceCrew AI in the field',
    links: [
      { name: 'App Installation', href: '/docs/mobile/installation' },
      { name: 'Job Completion', href: '/docs/mobile/job-completion' },
      { name: 'Photo Documentation', href: '/docs/mobile/photos' },
      { name: 'Offline Mode', href: '/docs/mobile/offline' },
    ],
  },
  {
    title: 'Invoicing & Payments',
    icon: CurrencyDollarIcon,
    description: 'Billing and payment processing',
    links: [
      { name: 'Creating Invoices', href: '/docs/invoicing/creating' },
      { name: 'Payment Processing', href: '/docs/invoicing/payments' },
      { name: 'Estimates & Quotes', href: '/docs/invoicing/estimates' },
      { name: 'Pricebook Setup', href: '/docs/invoicing/pricebook' },
    ],
  },
  {
    title: 'API & Integrations',
    icon: CodeBracketIcon,
    description: 'Connect with other tools',
    links: [
      { name: 'API Overview', href: '/api-docs' },
      { name: 'Authentication', href: '/docs/integrations/authentication' },
      { name: 'Webhooks', href: '/docs/integrations/webhooks' },
      { name: 'QuickBooks Integration', href: '/docs/integrations/quickbooks' },
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Documentation</h1>
            <p className="text-xl text-gray-600">
              Everything you need to know about using ServiceCrew AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docSections.map((section, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <section.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{section.description}</p>
                <ul className="space-y-2">
                  {section.links.map((link, i) => (
                    <li key={i}>
                      <Link href={link.href} className="text-primary-600 hover:text-primary-500 text-sm">
                        {link.name} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gray-50 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Can't find what you're looking for?</h3>
            <p className="text-gray-600 mb-4">
              Our support team is happy to help with any questions.
            </p>
            <Link href="/contact" className="btn-primary inline-block">
              Contact Support
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
