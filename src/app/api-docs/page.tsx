'use client'

import { CodeBracketIcon, KeyIcon, BookOpenIcon, RocketLaunchIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">API Documentation</h1>
            <p className="text-xl text-gray-600">
              Integrate ServiceCrew AI with your existing tools and workflows
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <KeyIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentication</h3>
              <p className="text-gray-600 mb-4">
                Secure API access using API keys. Generate keys from your dashboard settings.
              </p>
              <code className="block bg-gray-100 p-3 rounded text-sm">
                Authorization: Bearer YOUR_API_KEY
              </code>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <RocketLaunchIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Base URL</h3>
              <p className="text-gray-600 mb-4">
                All API requests should be made to our secure endpoint.
              </p>
              <code className="block bg-gray-100 p-3 rounded text-sm">
                https://api.servicecrewai.com/v1
              </code>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Endpoints</h2>
            <div className="space-y-4">
              {[
                { method: 'GET', endpoint: '/jobs', description: 'List all jobs' },
                { method: 'POST', endpoint: '/jobs', description: 'Create a new job' },
                { method: 'GET', endpoint: '/jobs/:id', description: 'Get job details' },
                { method: 'PUT', endpoint: '/jobs/:id', description: 'Update a job' },
                { method: 'GET', endpoint: '/customers', description: 'List all customers' },
                { method: 'POST', endpoint: '/customers', description: 'Create a new customer' },
                { method: 'GET', endpoint: '/technicians', description: 'List all technicians' },
                { method: 'GET', endpoint: '/invoices', description: 'List all invoices' },
                { method: 'POST', endpoint: '/invoices', description: 'Create an invoice' },
                { method: 'GET', endpoint: '/estimates', description: 'List all estimates' },
              ].map((api, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <span className={`px-3 py-1 rounded text-sm font-mono font-medium ${
                    api.method === 'GET' ? 'bg-green-100 text-green-700' :
                    api.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {api.method}
                  </span>
                  <code className="text-gray-900 font-mono">{api.endpoint}</code>
                  <span className="text-gray-500 ml-auto">{api.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <CodeBracketIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">SDKs & Libraries</h3>
              <p className="text-gray-600 mb-4">
                Official SDKs available for popular languages.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li>JavaScript / Node.js</li>
                <li>Python</li>
                <li>PHP</li>
                <li>Ruby</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpenIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                Our developer support team is here to help you integrate.
              </p>
              <a href="mailto:api@servicecrewai.com" className="text-primary-600 hover:text-primary-500 font-medium">
                Contact Developer Support
              </a>
            </div>
          </div>

          <div className="mt-12 text-center bg-gray-50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">API Access</h3>
            <p className="text-gray-600 mb-4">
              API access is available on Business plan and above.
            </p>
            <a href="/#pricing" className="btn-primary inline-block">
              View Pricing
            </a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
