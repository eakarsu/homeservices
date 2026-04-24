'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  BellIcon,
  CreditCardIcon,
  EnvelopeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  KeyIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-primary-50 rounded-lg">
          <KeyIcon className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Change Password</h3>
          <p className="text-sm text-gray-500">Update your account password</p>
        </div>
      </div>
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className="label">Current Password</label>
          <input
            id="currentPassword"
            type="password"
            required
            className="input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="label">New Password</label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={8}
            className="input"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="label">Confirm New Password</label>
          <input
            id="confirmPassword"
            type="password"
            required
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}

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

      {/* Change Password */}
      <ChangePasswordCard />

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
