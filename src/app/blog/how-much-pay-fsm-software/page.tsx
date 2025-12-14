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
                Buying Guide
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                December 5, 2025
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                6 min read
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              How Much Should You Really Pay for Field Service Software?
            </h1>
            <p className="text-xl text-gray-600">
              A data-driven guide to FSM software pricing in 2025, and what you should expect to pay based on your business size.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              Field service management software pricing is all over the map — from free to $500+ per user per month. How do you know if you're getting a fair deal? This guide breaks down what different contractors should expect to pay based on business size and needs.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The Current State of FSM Pricing
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Field service software pricing generally falls into three tiers:
            </p>
            <div className="grid md:grid-cols-3 gap-4 my-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-bold text-green-900 text-lg mb-2">Budget</p>
                <p className="text-2xl font-bold text-green-700 mb-2">$0-100/mo</p>
                <p className="text-green-800 text-sm">Basic features, limited users, some restrictions</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-bold text-blue-900 text-lg mb-2">Mid-Market</p>
                <p className="text-2xl font-bold text-blue-700 mb-2">$100-500/mo</p>
                <p className="text-blue-800 text-sm">Full features, moderate user counts, good support</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="font-bold text-purple-900 text-lg mb-2">Enterprise</p>
                <p className="text-2xl font-bold text-purple-700 mb-2">$500-5000+/mo</p>
                <p className="text-purple-800 text-sm">Advanced features, unlimited scale, dedicated support</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              What You Should Pay Based on Business Size
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Solo Operator (1 person)
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you're a one-person operation, you should pay <strong>$0-50/month</strong>.
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Many platforms offer free tiers for single users</li>
              <li>You need: basic scheduling, invoicing, customer management</li>
              <li>You don't need: multi-user features, advanced dispatch, complex reporting</li>
            </ul>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-800"><strong>Recommendation:</strong> Start with a free plan. Upgrade only when you're ready to hire.</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Small Team (2-5 people)
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              For a small team, expect to pay <strong>$50-150/month total</strong>.
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Avoid per-technician pricing — it scales poorly</li>
              <li>You need: multi-user access, basic dispatch, mobile app</li>
              <li>Nice to have: GPS tracking, basic reporting</li>
            </ul>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
              <p className="text-amber-800"><strong>Warning:</strong> Some platforms advertise $50/month but charge per-user. A 5-person team at $50/user = $250/month. Read the fine print.</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Growing Business (6-15 people)
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              A growing business should pay <strong>$100-300/month total</strong>.
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>This is where flat-rate pricing becomes critical</li>
              <li>You need: smart dispatch, route optimization, inventory basics</li>
              <li>You need: reporting and analytics, service agreements</li>
            </ul>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-800"><strong>Comparison:</strong> A 10-person shop pays $99/month with flat-rate pricing vs. $2,500+/month with per-technician enterprise software. Same features, 96% savings.</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Established Business (16-50 people)
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Established businesses should pay <strong>$200-500/month total</strong>.
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>You need: advanced dispatch, AI features, full inventory management</li>
              <li>You need: multi-location support, advanced analytics</li>
              <li>Priority support and dedicated account management become valuable</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Large Enterprise (50+ people)
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Large enterprises typically pay <strong>$500-2,000/month total</strong> (though some pay much more).
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Custom integrations and API access are essential</li>
              <li>Multi-location, multi-region support required</li>
              <li>Dedicated support and custom development may be justified</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The 1% Rule: A Simple Benchmark
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              A good rule of thumb: <strong>your FSM software should cost no more than 1% of your annual revenue</strong>.
            </p>
            <div className="bg-gray-50 rounded-xl p-6 my-6">
              <p className="font-semibold text-gray-900 mb-3">Apply the 1% Rule:</p>
              <ul className="space-y-2 text-gray-700">
                <li>• $500K annual revenue → Max $5,000/year ($417/month)</li>
                <li>• $1M annual revenue → Max $10,000/year ($833/month)</li>
                <li>• $2M annual revenue → Max $20,000/year ($1,667/month)</li>
              </ul>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              If your software costs more than 1% of revenue, you're likely overpaying — or using software designed for larger businesses.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Red Flags in FSM Pricing
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Watch out for these pricing practices:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Per-technician fees above $100/month:</strong> This pricing model punishes growth</li>
              <li><strong>Required annual contracts:</strong> Monthly flexibility is standard in 2025</li>
              <li><strong>Setup fees over $1,000:</strong> Most modern software needs minimal setup</li>
              <li><strong>"Contact us for pricing":</strong> Usually means expensive and negotiable</li>
              <li><strong>Essential features as add-ons:</strong> Dispatch, mobile app, and invoicing should be included</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              What Features Should Be Included
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              At any price point above $50/month, these features should be standard:
            </p>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">Must-Have (Included)</p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>✓ Job scheduling & dispatch</li>
                  <li>✓ Customer management (CRM)</li>
                  <li>✓ Estimates & invoicing</li>
                  <li>✓ Mobile app for technicians</li>
                  <li>✓ Basic reporting</li>
                  <li>✓ Email/SMS notifications</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">Should Be Included ($100+)</p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>✓ GPS tracking</li>
                  <li>✓ Route optimization</li>
                  <li>✓ Inventory management</li>
                  <li>✓ Service agreements</li>
                  <li>✓ Payment processing</li>
                  <li>✓ QuickBooks integration</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              How to Negotiate Better Pricing
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              If you're considering enterprise software, here's how to negotiate:
            </p>
            <ol className="list-decimal pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Get competing quotes:</strong> Having alternatives gives you leverage</li>
              <li><strong>Ask for annual payment discounts:</strong> Often 10-20% off</li>
              <li><strong>Negotiate setup fees:</strong> These are almost always negotiable</li>
              <li><strong>Request feature bundles:</strong> Get add-ons included in the base price</li>
              <li><strong>Ask about startup/small business programs:</strong> Many vendors have discounted tiers</li>
              <li><strong>Time your purchase:</strong> End of quarter/year often brings better deals</li>
            </ol>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The Bottom Line
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              In 2025, there's no reason for a contractor with fewer than 50 employees to pay more than $500/month for field service software. Modern platforms offer enterprise-level features at a fraction of the cost.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              The key is finding software with <strong>flat-rate pricing</strong> that includes all the features you need. Avoid per-technician models that punish you for growing your business.
            </p>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 my-10">
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                Fair Pricing, Real Features
              </h3>
              <p className="text-primary-800 mb-4">
                ServiceCrew AI starts at $0/month (free forever for solo operators) and goes up to just $199/month for unlimited users. All plans include AI dispatch, scheduling, invoicing, mobile app, and more. No per-technician fees. No contracts.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                  Start Free Trial
                </Link>
                <Link href="/#pricing" className="inline-block bg-white text-primary-600 border border-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>

      <PublicFooter />
    </div>
  )
}
