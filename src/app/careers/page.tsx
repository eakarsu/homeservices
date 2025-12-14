'use client'

import { MapPinIcon, BriefcaseIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

const openPositions = [
  {
    title: 'Senior Full Stack Engineer',
    department: 'Engineering',
    location: 'Remote (US)',
    type: 'Full-time',
    salary: '$150k - $200k',
  },
  {
    title: 'Product Designer',
    department: 'Design',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120k - $160k',
  },
  {
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'Remote (US)',
    type: 'Full-time',
    salary: '$80k - $110k',
  },
  {
    title: 'Sales Development Representative',
    department: 'Sales',
    location: 'Remote (US)',
    type: 'Full-time',
    salary: '$60k - $80k + Commission',
  },
  {
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Remote (US)',
    type: 'Full-time',
    salary: '$140k - $180k',
  },
]

const benefits = [
  'Competitive salary and equity',
  'Health, dental, and vision insurance',
  'Unlimited PTO',
  'Remote-first culture',
  '401(k) matching',
  'Home office stipend',
  'Professional development budget',
  'Team retreats',
]

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Join Our Team</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Help us build the future of field service management. We're looking for
              passionate people who want to make a difference.
            </p>
          </div>

          {/* Benefits */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why ServiceCrew AI?</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-700 text-sm">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Open Positions */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Open Positions</h2>
            <div className="space-y-4">
              {openPositions.map((position, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{position.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <BriefcaseIcon className="h-4 w-4" />
                          {position.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4" />
                          {position.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <CurrencyDollarIcon className="h-4 w-4" />
                          {position.salary}
                        </span>
                      </div>
                    </div>
                    <button className="btn-primary whitespace-nowrap">
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* No Position? */}
          <div className="mt-12 text-center bg-gray-50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Don't see the right role?</h3>
            <p className="text-gray-600 mb-4">
              We're always looking for talented people. Send us your resume and we'll keep you in mind.
            </p>
            <a href="mailto:careers@servicecrewai.com" className="text-primary-600 hover:text-primary-500 font-medium">
              careers@servicecrewai.com
            </a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
