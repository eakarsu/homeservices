'use client'

import Link from 'next/link'
import { ArrowLeftIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function BlogArticle() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-500 mb-6 font-medium">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Blog
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-medium">
                Industry Analysis
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                December 7, 2025
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                8 min read
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Why Contractors Are Leaving ServiceTitan in 2025
            </h1>
            <p className="text-xl text-gray-600">
              The exodus from expensive enterprise software is accelerating. Here's what's driving contractors to seek alternatives.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              ServiceTitan has long been the dominant player in field service management software for home service contractors. But in 2025, something is changing. Contractors across the HVAC, plumbing, and electrical industries are increasingly looking for alternatives. Here's why.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              1. The Per-Technician Pricing Model is Crushing Margins
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              ServiceTitan charges between $245-500 per technician per month. For a 10-technician shop, that's $2,500-5,000 monthly — or $30,000-60,000 annually — just for software.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              As labor costs rise and margins tighten, contractors are realizing that per-technician pricing doesn't scale. Every new hire comes with a significant software tax, making growth more expensive than it needs to be.
            </p>
            <div className="bg-red-50 border-l-4 border-red-500 p-6 my-8">
              <p className="text-red-800 font-semibold mb-2">The Math Doesn't Work</p>
              <p className="text-red-700">
                A contractor with 15 technicians paying $300/tech/month spends $54,000/year on software alone. That's often more than a full-time employee's salary.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              2. Long-Term Contracts Lock You In
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              ServiceTitan typically requires 12-24 month contracts. If your business needs change, if you're unhappy with the service, or if a better option comes along — too bad. You're locked in.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              In today's fast-moving market, contractors want flexibility. They want to be able to switch providers if something isn't working, without paying thousands in early termination fees.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              3. Setup Fees Are Astronomical
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Implementation and onboarding fees for ServiceTitan can range from $5,000 to $50,000 or more. That's a massive upfront investment before you've even seen if the software works for your business.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Smaller contractors especially feel this pain. A $20,000 setup fee can be the difference between investing in new equipment, hiring another technician, or upgrading your trucks.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              4. Feature Bloat and Complexity
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              ServiceTitan was built for large enterprises with dedicated IT teams and operations managers. For a 5-15 person shop, much of the software goes unused while adding unnecessary complexity.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Contractors report spending weeks in training, only to use maybe 30% of the features. They're paying for enterprise complexity when they need straightforward tools that just work.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              5. Modern Alternatives Have Caught Up
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Five years ago, ServiceTitan had clear technological advantages. Today, modern SaaS platforms offer comparable — and sometimes superior — features at a fraction of the cost.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              AI-powered dispatch, smart scheduling, mobile apps, digital invoicing, and real-time dashboards are no longer exclusive to enterprise software. New platforms have democratized these features.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              6. Customer Support Frustrations
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              As ServiceTitan has grown, many contractors report declining support quality. Wait times have increased, and getting issues resolved can take days or weeks.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              When your business depends on software working correctly, slow support isn't just frustrating — it's costly. Every hour of downtime or workaround means lost revenue.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              What Contractors Want Instead
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              The contractors leaving ServiceTitan aren't looking for less functionality. They want:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Flat, predictable pricing</strong> — Know exactly what you'll pay each month</li>
              <li><strong>No per-technician fees</strong> — Scale without penalty</li>
              <li><strong>No contracts</strong> — Month-to-month flexibility</li>
              <li><strong>Zero setup fees</strong> — Start using the software immediately</li>
              <li><strong>Modern AI features</strong> — Smart dispatch, diagnostics, and automation</li>
              <li><strong>Simplicity</strong> — Tools that work without weeks of training</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The Bottom Line
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              ServiceTitan built a great product for a specific market: large enterprises with big budgets. But for the vast majority of contractors — shops with 1-20 technicians — it's simply overkill.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              The 2025 exodus isn't about ServiceTitan being bad. It's about better options existing for contractors who want powerful software without the enterprise price tag and complexity.
            </p>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 my-10">
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                Ready to Make the Switch?
              </h3>
              <p className="text-primary-800 mb-4">
                ServiceCrew AI offers all the features you need — AI dispatch, scheduling, invoicing, mobile app — for a flat $99/month for up to 10 users. No contracts, no setup fees, no per-technician charges.
              </p>
              <Link href="/register" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                Start Your Free 14-Day Trial
              </Link>
            </div>
          </div>
        </article>
      </main>

      <PublicFooter />
    </div>
  )
}
