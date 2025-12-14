'use client'

import Link from 'next/link'
import { ArrowLeftIcon, UserGroupIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function RolesPermissionsPage() {
  const roles = [
    {
      name: 'Admin',
      description: 'Full access to all features and settings',
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      permissions: {
        'View Dashboard': true,
        'Manage Jobs': true,
        'Manage Customers': true,
        'Manage Technicians': true,
        'View Reports': true,
        'Manage Invoices': true,
        'Company Settings': true,
        'User Management': true,
        'Billing & Subscription': true,
      },
    },
    {
      name: 'Dispatcher',
      description: 'Schedule and assign jobs to technicians',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      permissions: {
        'View Dashboard': true,
        'Manage Jobs': true,
        'Manage Customers': true,
        'Manage Technicians': false,
        'View Reports': true,
        'Manage Invoices': true,
        'Company Settings': false,
        'User Management': false,
        'Billing & Subscription': false,
      },
    },
    {
      name: 'Technician',
      description: 'View and complete assigned jobs',
      color: 'bg-green-100 text-green-700 border-green-200',
      permissions: {
        'View Dashboard': true,
        'Manage Jobs': false,
        'Manage Customers': false,
        'Manage Technicians': false,
        'View Reports': false,
        'Manage Invoices': false,
        'Company Settings': false,
        'User Management': false,
        'Billing & Subscription': false,
      },
    },
  ]

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
                  <UserGroupIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">User Roles & Permissions</h1>
                  <p className="text-violet-100 mt-1">Understand different user roles and access levels</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Overview
                </h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700">
                    ServiceCrew AI uses role-based access control to ensure team members have
                    appropriate access to features and data. Each user is assigned one role
                    that determines their permissions throughout the system.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Available Roles
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {roles.map((role) => (
                    <div key={role.name} className={`p-5 rounded-xl border ${role.color}`}>
                      <h3 className="text-lg font-semibold mb-2">{role.name}</h3>
                      <p className="text-sm opacity-80">{role.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Permissions Matrix
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 rounded-tl-lg">Permission</th>
                        {roles.map((role) => (
                          <th key={role.name} className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                            {role.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.keys(roles[0].permissions).map((permission) => (
                        <tr key={permission} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">{permission}</td>
                          {roles.map((role) => (
                            <td key={`${role.name}-${permission}`} className="px-4 py-3 text-center">
                              {role.permissions[permission as keyof typeof role.permissions] ? (
                                <div className="inline-flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                                  <CheckIcon className="h-4 w-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
                                  <XMarkIcon className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Assigning Roles
                </h2>
                <div className="space-y-3">
                  {[
                    'Go to Settings → Team Members',
                    'Click on a team member\'s name',
                    'Select the appropriate role from the dropdown',
                    'Click Save Changes',
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

              <div className="bg-violet-50 border border-violet-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <UserGroupIcon className="h-6 w-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-violet-900 mb-1">Custom Roles (Business Plan)</h3>
                    <p className="text-violet-800 text-sm">
                      Business plan subscribers can create custom roles with specific permissions
                      tailored to their organization's needs. Contact support to learn more about
                      custom role configuration.
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
