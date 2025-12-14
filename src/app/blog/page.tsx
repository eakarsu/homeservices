'use client'

import Link from 'next/link'
import { CalendarIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

const blogPosts = [
  {
    slug: 'why-contractors-leaving-servicetitan',
    title: 'Why Contractors Are Leaving ServiceTitan in 2025',
    excerpt: 'The exodus from expensive enterprise software is accelerating. Here\'s what\'s driving contractors to seek alternatives.',
    date: 'December 7, 2025',
    category: 'Industry Analysis',
    readTime: '8 min read',
  },
  {
    slug: 'hidden-costs-field-service-software',
    title: 'The Hidden Costs of Field Service Software Nobody Talks About',
    excerpt: 'That $99/month software might actually cost you $500/month. Here\'s what vendors don\'t tell you upfront.',
    date: 'December 6, 2025',
    category: 'Industry Analysis',
    readTime: '7 min read',
  },
  {
    slug: 'how-much-pay-fsm-software',
    title: 'How Much Should You Really Pay for Field Service Software?',
    excerpt: 'A data-driven guide to FSM software pricing in 2025, and what you should expect to pay based on your business size.',
    date: 'December 5, 2025',
    category: 'Buying Guide',
    readTime: '6 min read',
  },
  {
    slug: 'choose-fsm-software-hvac',
    title: 'How to Choose the Right Field Service Software for Your HVAC Business',
    excerpt: 'A comprehensive guide to evaluating, comparing, and selecting FSM software that fits your HVAC company\'s needs.',
    date: 'December 4, 2025',
    category: 'Buying Guide',
    readTime: '10 min read',
  },
  {
    slug: 'ai-revolutionizing-field-service',
    title: '5 Ways AI is Revolutionizing Field Service Management',
    excerpt: 'Artificial intelligence isn\'t just a buzzword — it\'s transforming how contractors dispatch, diagnose, price, and run their businesses.',
    date: 'December 3, 2025',
    category: 'Industry Trends',
    readTime: '8 min read',
  },
  {
    slug: 'route-optimization-guide',
    title: 'The Ultimate Guide to Route Optimization for Service Contractors',
    excerpt: 'How smart routing can save your business thousands in fuel costs, add more jobs per day, and improve customer satisfaction.',
    date: 'December 2, 2025',
    category: 'Operations',
    readTime: '9 min read',
  },
  {
    slug: 'hvac-business-software-guide-2025',
    title: 'HVAC Business Management: Complete Software Guide for 2025',
    excerpt: 'Everything HVAC contractors need to know about business management software — from scheduling to service agreements.',
    date: 'December 1, 2025',
    category: 'HVAC',
    readTime: '12 min read',
  },
  {
    slug: 'plumbing-business-software-features',
    title: 'Plumbing Business Software: What Features Actually Matter',
    excerpt: 'A plumber\'s guide to choosing software that handles the unique demands of plumbing businesses.',
    date: 'November 30, 2025',
    category: 'Plumbing',
    readTime: '10 min read',
  },
  {
    slug: 'electrical-contractor-software-guide',
    title: 'Electrical Contractor Software: From Dispatch to Invoice',
    excerpt: 'A complete guide to field service software for electrical contractors — covering service calls, EV chargers, and more.',
    date: 'November 28, 2025',
    category: 'Electrical',
    readTime: '10 min read',
  },
  {
    slug: 'servicecrew-ai-vs-servicetitan',
    title: 'ServiceCrew AI vs ServiceTitan: Full Comparison for 2025',
    excerpt: 'An honest, feature-by-feature comparison to help you decide which field service software is right for your business.',
    date: 'November 26, 2025',
    category: 'Comparison',
    readTime: '10 min read',
  },
  {
    slug: 'best-fsm-software-small-contractors-2025',
    title: 'Best Field Service Software for Small Contractors (2025)',
    excerpt: 'Our picks for the best FSM software for contractors with 1-20 technicians — with honest pros, cons, and pricing.',
    date: 'November 24, 2025',
    category: 'Software Reviews',
    readTime: '12 min read',
  },
  {
    slug: 'free-vs-paid-fsm-software',
    title: 'Free vs Paid Field Service Software: Which is Right for You?',
    excerpt: 'An honest look at when free FSM software makes sense, when to upgrade to paid, and how to evaluate the true cost of "free."',
    date: 'November 22, 2025',
    category: 'Buying Guide',
    readTime: '8 min read',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog</h1>
            <p className="text-xl text-gray-600">
              Insights, guides, and tips for home service professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.slug}>
                <article className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow h-full">
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded text-xs font-medium">
                        {post.category}
                      </span>
                      <span>{post.readTime}</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-primary-600">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 text-sm mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4" />
                      {post.date}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Want more insights delivered to your inbox?
            </p>
            <div className="flex justify-center gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button className="btn-primary px-6 py-2">
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
