'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon, BookOpenIcon, ChatBubbleLeftRightIcon, PlayCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

const categories = [
  {
    name: 'Getting Started',
    icon: PlayCircleIcon,
    articles: ['Quick start guide', 'Setting up your company', 'Adding your first technician', 'Creating your first job'],
  },
  {
    name: 'Scheduling & Dispatch',
    icon: BookOpenIcon,
    articles: ['Using the dispatch board', 'AI-powered scheduling', 'Managing technician availability', 'Route optimization'],
  },
  {
    name: 'Invoicing & Payments',
    icon: BookOpenIcon,
    articles: ['Creating invoices', 'Setting up payment processing', 'Sending estimates', 'Managing pricebooks'],
  },
  {
    name: 'Mobile App',
    icon: BookOpenIcon,
    articles: ['Downloading the app', 'Completing jobs on mobile', 'Collecting signatures', 'Taking photos'],
  },
]

const faqs = [
  {
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page and enter your email. You\'ll receive a reset link within minutes.',
  },
  {
    question: 'Can I import my existing customers?',
    answer: 'Yes! Go to Settings > Import Data and upload a CSV file with your customer information.',
  },
  {
    question: 'How do I add a new technician?',
    answer: 'Navigate to Technicians > Add New and fill in their details. They\'ll receive an email to set up their account.',
  },
  {
    question: 'Is there a mobile app?',
    answer: 'Yes, we have mobile apps for both iOS and Android. Technicians can manage jobs, collect signatures, and more.',
  },
]

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12 bg-primary-600 rounded-2xl p-12 text-white">
            <h1 className="text-4xl font-bold mb-4">How can we help?</h1>
            <div className="max-w-xl mx-auto relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search for help articles..."
                className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {categories.map((category, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <category.icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  </div>
                  <ul className="space-y-2">
                    {category.articles.map((article, i) => (
                      <li key={i}>
                        <a href="#" className="text-gray-600 hover:text-primary-600 text-sm">
                          {article}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <QuestionMarkCircleIcon className="h-6 w-6 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
              <ChatBubbleLeftRightIcon className="h-10 w-10 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat with Support</h3>
              <p className="text-gray-600 mb-4">Get help from our team in real-time.</p>
              <button className="btn-primary">Start Chat</button>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
              <BookOpenIcon className="h-10 w-10 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4">We typically respond within 24 hours.</p>
              <a href="mailto:support@servicecrewai.com" className="btn-secondary inline-block">
                Email Us
              </a>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
