'use client'

import { CalendarIcon, ClockIcon, PlayIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

const upcomingWebinars = [
  {
    title: 'Mastering AI-Powered Dispatch',
    description: 'Learn how to use our AI dispatch features to optimize your technician schedules and reduce drive time.',
    date: 'December 15, 2025',
    time: '2:00 PM EST',
    host: 'Sarah Johnson, Product Manager',
    attendees: 156,
  },
  {
    title: 'Year-End Financial Review with ServiceCrew AI',
    description: 'How to use reports and analytics to review your business performance and plan for next year.',
    date: 'December 20, 2025',
    time: '1:00 PM EST',
    host: 'Mike Chen, Customer Success',
    attendees: 89,
  },
  {
    title: 'New Features Q1 2026 Preview',
    description: 'Get a sneak peek at upcoming features and improvements coming to ServiceCrew AI.',
    date: 'January 10, 2026',
    time: '3:00 PM EST',
    host: 'Tom Wilson, CEO',
    attendees: 234,
  },
]

const pastWebinars = [
  {
    title: 'Getting Started with ServiceCrew AI',
    description: 'Complete walkthrough for new users.',
    duration: '45 min',
    views: 1250,
  },
  {
    title: 'Advanced Invoicing Techniques',
    description: 'Tips for faster payments and better cash flow.',
    duration: '38 min',
    views: 890,
  },
  {
    title: 'Mobile App Deep Dive',
    description: 'Everything technicians need to know.',
    duration: '52 min',
    views: 2100,
  },
  {
    title: 'Customer Communication Automation',
    description: 'Setting up automated texts and emails.',
    duration: '35 min',
    views: 750,
  },
  {
    title: 'Inventory Management Best Practices',
    description: 'Tracking parts and supplies efficiently.',
    duration: '42 min',
    views: 620,
  },
  {
    title: 'Building Service Agreements',
    description: 'Creating recurring revenue streams.',
    duration: '48 min',
    views: 980,
  },
]

export default function WebinarsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Webinars</h1>
            <p className="text-xl text-gray-600">
              Live training sessions and recorded tutorials from our team
            </p>
          </div>

          {/* Upcoming Webinars */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Webinars</h2>
            <div className="space-y-4">
              {upcomingWebinars.map((webinar, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                          Live
                        </span>
                        <span className="flex items-center gap-1 text-gray-500 text-sm">
                          <UserGroupIcon className="h-4 w-4" />
                          {webinar.attendees} registered
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{webinar.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{webinar.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {webinar.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {webinar.time}
                        </span>
                        <span>Hosted by {webinar.host}</span>
                      </div>
                    </div>
                    <button className="btn-primary whitespace-nowrap">
                      Register Free
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Webinars */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">On-Demand Recordings</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastWebinars.map((webinar, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="h-32 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center relative">
                    <PlayIcon className="h-12 w-12 text-white opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                      {webinar.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">{webinar.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {webinar.duration}
                      </span>
                      <span>{webinar.views.toLocaleString()} views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="mt-12 bg-primary-600 rounded-xl p-8 text-center text-white">
            <h3 className="text-xl font-semibold mb-2">Never miss a webinar</h3>
            <p className="text-primary-100 mb-4">
              Subscribe to get notified about upcoming live sessions.
            </p>
            <div className="flex justify-center gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg text-gray-900"
              />
              <button className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
