'use client'

import Link from 'next/link'
import {
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  BellIcon,
  CreditCardIcon,
  EnvelopeIcon,
  UserGroupIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const settingsSections = [
    {
      title: 'Business',
      items: [
        {
          name: 'Company Profile',
          description: 'Business name, address, and contact info',
          href: '/dashboard/settings/company',
          icon: BuildingOfficeIcon,
        },
        {
          name: 'Users & Roles',
          description: 'Manage team members and permissions',
          href: '/dashboard/settings/users',
          icon: UserGroupIcon,
        },
      ],
    },
    {
      title: 'Services',
      items: [
        {
          name: 'Service Types',
          description: 'Configure service categories and defaults',
          href: '/dashboard/settings/service-types',
          icon: WrenchScrewdriverIcon,
        },
        {
          name: 'Pricebook',
          description: 'Manage labor rates, parts pricing, and flat rates',
          href: '/dashboard/settings/pricebook',
          icon: CurrencyDollarIcon,
        },
      ],
    },
    {
      title: 'Integrations',
      items: [
        {
          name: 'Payment Processing',
          description: 'Configure Stripe for credit card payments',
          href: '/dashboard/settings/payments',
          icon: CreditCardIcon,
        },
        {
          name: 'Email & SMS',
          description: 'Configure Twilio and email notifications',
          href: '/dashboard/settings/notifications',
          icon: EnvelopeIcon,
        },
        {
          name: 'Integrations',
          description: 'Configure third-party integrations',
          href: '/dashboard/settings/integrations',
          icon: Cog6ToothIcon,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          name: 'Notifications',
          description: 'Alert preferences and schedules',
          href: '/dashboard/settings/alerts',
          icon: BellIcon,
        },
        {
          name: 'General',
          description: 'Timezone, date format, and defaults',
          href: '/dashboard/settings/general',
          icon: Cog6ToothIcon,
        },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Configure your business and application preferences</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        {settingsSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{section.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="card hover:shadow-md transition-shadow flex items-start gap-4"
                >
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <item.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
