'use client'

import { ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

const guides = [
  {
    title: 'Complete Guide to Field Service Scheduling',
    description: 'Learn best practices for scheduling technicians, optimizing routes, and reducing drive time.',
    category: 'Scheduling',
    readTime: '15 min read',
    image: '/images/guide-scheduling.jpg',
  },
  {
    title: 'How to Set Up Your Pricebook',
    description: 'Step-by-step guide to creating a pricebook that maximizes profits and simplifies quoting.',
    category: 'Pricing',
    readTime: '10 min read',
    image: '/images/guide-pricebook.jpg',
  },
  {
    title: 'Mastering the Dispatch Board',
    description: 'Everything you need to know about using the dispatch board effectively.',
    category: 'Dispatch',
    readTime: '12 min read',
    image: '/images/guide-dispatch.jpg',
  },
  {
    title: 'Customer Communication Best Practices',
    description: 'How to keep customers informed and happy throughout the service process.',
    category: 'Customer Success',
    readTime: '8 min read',
    image: '/images/guide-communication.jpg',
  },
  {
    title: 'Invoicing and Getting Paid Faster',
    description: 'Tips and tricks for creating professional invoices and collecting payments quickly.',
    category: 'Invoicing',
    readTime: '10 min read',
    image: '/images/guide-invoicing.jpg',
  },
  {
    title: 'Using AI Features to Grow Your Business',
    description: 'How to leverage ServiceCrew AI\'s artificial intelligence features for better results.',
    category: 'AI Features',
    readTime: '12 min read',
    image: '/images/guide-ai.jpg',
  },
  {
    title: 'Mobile App Guide for Technicians',
    description: 'Complete guide for technicians using the ServiceCrew AI mobile app in the field.',
    category: 'Mobile',
    readTime: '15 min read',
    image: '/images/guide-mobile.jpg',
  },
  {
    title: 'Reporting and Analytics Deep Dive',
    description: 'Understanding your data and making informed business decisions.',
    category: 'Analytics',
    readTime: '12 min read',
    image: '/images/guide-analytics.jpg',
  },
]

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Guides & Tutorials</h1>
            <p className="text-xl text-gray-600">
              In-depth guides to help you get the most out of ServiceCrew AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {guides.map((guide, index) => (
              <article key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <span className="text-white text-6xl font-bold opacity-20">{index + 1}</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded text-xs font-medium">
                      {guide.category}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500 text-sm">
                      <ClockIcon className="h-4 w-4" />
                      {guide.readTime}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {guide.title}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">{guide.description}</p>
                  <span className="text-primary-600 font-medium text-sm flex items-center gap-1">
                    Read Guide <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 text-center bg-gray-50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Want more guides?</h3>
            <p className="text-gray-600 mb-4">
              Subscribe to our newsletter for new guides and tips delivered to your inbox.
            </p>
            <div className="flex justify-center gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button className="btn-primary px-6 py-2">Subscribe</button>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
