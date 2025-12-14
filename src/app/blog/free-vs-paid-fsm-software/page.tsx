'use client'

import Link from 'next/link'
import { ArrowLeftIcon, CalendarIcon, ClockIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
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
                November 22, 2025
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                8 min read
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Free vs Paid Field Service Software: Which is Right for You?
            </h1>
            <p className="text-xl text-gray-600">
              An honest look at when free FSM software makes sense, when to upgrade to paid, and how to evaluate the true cost of "free."
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              Free field service software sounds appealing — who doesn't want to save money? But "free" comes with trade-offs, and for many contractors, a paid solution quickly pays for itself. Let's break down when each option makes sense.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Types of Free FSM Software
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Not all free software is created equal. Here are the main types:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              1. True Free Plans (Freemium)
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Some companies offer genuinely free tiers with limited features:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Limited number of users (usually 1-2)</li>
              <li>Capped jobs per month (25-50 typical)</li>
              <li>Basic features only</li>
              <li>Company branding on customer-facing materials</li>
              <li>Upgrade path to paid tiers available</li>
            </ul>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-800"><strong>Best for:</strong> Solo operators just starting out who want to test software before committing.</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              2. Free Trials (Time-Limited)
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Most paid software offers free trials:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Full features for limited time (7-30 days)</li>
              <li>Credit card may or may not be required</li>
              <li>Converts to paid after trial ends</li>
              <li>Good for evaluating premium features</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              3. Open Source Software
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Free to use but requires technical expertise:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>No licensing costs</li>
              <li>Requires self-hosting</li>
              <li>Technical setup and maintenance needed</li>
              <li>Limited or community-only support</li>
              <li>May need developer for customizations</li>
            </ul>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
              <p className="text-amber-800"><strong>Reality check:</strong> Open source sounds free, but hosting, maintenance, and technical support costs add up. Most contractors are better off with SaaS solutions.</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              4. "Free" with Hidden Costs
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Some free software monetizes through:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>High payment processing fees (3%+ per transaction)</li>
              <li>Selling your customer data</li>
              <li>Requiring expensive add-ons for basic features</li>
              <li>Advertising to your customers</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              What Free Software Typically Offers
            </h2>
            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Feature</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">Free Plans</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">Paid Plans</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Basic Scheduling', free: true, paid: true },
                    { feature: 'Customer Management', free: true, paid: true },
                    { feature: 'Simple Invoicing', free: true, paid: true },
                    { feature: 'Mobile App', free: 'Limited', paid: true },
                    { feature: 'Multiple Users', free: false, paid: true },
                    { feature: 'Dispatch Board', free: false, paid: true },
                    { feature: 'GPS Tracking', free: false, paid: true },
                    { feature: 'Inventory Management', free: false, paid: true },
                    { feature: 'Reporting & Analytics', free: 'Basic', paid: true },
                    { feature: 'Service Agreements', free: false, paid: true },
                    { feature: 'AI Features', free: false, paid: 'Some' },
                    { feature: 'Integrations', free: 'Limited', paid: true },
                    { feature: 'Priority Support', free: false, paid: true },
                    { feature: 'White-label/No Branding', free: false, paid: true },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="border border-gray-200 px-4 py-2">{row.feature}</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">
                        {row.free === true ? (
                          <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : row.free === false ? (
                          <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                        ) : (
                          <span className="text-gray-500 text-sm">{row.free}</span>
                        )}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-center">
                        {row.paid === true ? (
                          <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : row.paid === false ? (
                          <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                        ) : (
                          <span className="text-gray-500 text-sm">{row.paid}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              When Free Software Makes Sense
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Free field service software is a good choice if:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>You're a solo operator</strong> — Just you, no team to manage</li>
              <li><strong>You do fewer than 25 jobs per month</strong> — Low volume doesn't justify software cost</li>
              <li><strong>You're just getting started</strong> — Testing the waters, not ready to invest</li>
              <li><strong>Basic scheduling is all you need</strong> — No complex dispatch or inventory requirements</li>
              <li><strong>You want to evaluate before buying</strong> — Using free as a trial period</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              When to Upgrade to Paid Software
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              It's time to invest in paid software when:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              1. You're Losing Money to Inefficiency
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Calculate the cost of manual processes. If your dispatcher spends 30 minutes per day on tasks that software automates, that's 10+ hours per month. At $25/hour, that's $250/month — more than most software costs.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              2. You're Hiring Your First Employee
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              The moment you have multiple people, you need:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Dispatch and scheduling coordination</li>
              <li>GPS tracking to know where techs are</li>
              <li>Access controls (who can see/do what)</li>
              <li>Communication tools</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-6">
              Free software rarely supports multiple users well.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              3. You're Missing Jobs or Making Errors
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              If you've ever:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Double-booked a technician</li>
              <li>Forgot to invoice a customer</li>
              <li>Lost a customer's service history</li>
              <li>Sent a tech without the right parts</li>
              <li>Missed a follow-up opportunity</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-6">
              ...then software would likely pay for itself by preventing these costly mistakes.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              4. You Want to Grow
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Free software is designed for current you, not future you. If you plan to add technicians, increase job volume, or professionalize your operations, you'll need tools that scale.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              5. You're Doing More Than 50 Jobs Per Month
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              At this volume, the time savings from automation and the revenue from professional invoicing and follow-ups easily justify $50-100/month in software costs.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The True Cost of "Free"
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Free software has hidden costs:
            </p>

            <div className="bg-gray-50 rounded-xl p-6 my-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hidden Costs Calculator</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Manual scheduling time (10 hrs/mo @ $25/hr)</span>
                  <span className="font-semibold text-red-600">$250/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Missed follow-ups (2 jobs/mo @ $200 avg)</span>
                  <span className="font-semibold text-red-600">$400/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Invoice errors/delays (1% of revenue lost)</span>
                  <span className="font-semibold text-red-600">$200/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Inefficient routing (extra fuel/time)</span>
                  <span className="font-semibold text-red-600">$100/mo</span>
                </div>
                <div className="flex justify-between border-t pt-3 mt-3">
                  <span className="font-semibold text-gray-900">True cost of "free" software</span>
                  <span className="font-bold text-red-600">$950/mo</span>
                </div>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              When you factor in lost time, missed opportunities, and inefficiencies, "free" software often costs more than paid alternatives.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The Best of Both Worlds
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Some modern platforms offer genuinely useful free plans that can grow with you:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Free tier:</strong> Full features for solo operators</li>
              <li><strong>Low-cost upgrade:</strong> Add users and features as you grow</li>
              <li><strong>No contracts:</strong> Upgrade or downgrade anytime</li>
              <li><strong>Flat pricing:</strong> No surprise per-user fees</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-6">
              This model lets you start free, prove the value, and upgrade only when it makes sense for your business.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Our Recommendation
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>If you're a solo operator doing fewer than 25 jobs per month:</strong> Start with a free plan. Test the software, build habits, and upgrade when you're ready.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>If you have any employees or do more than 25 jobs per month:</strong> Invest in paid software. The ROI is almost always positive, and you'll run a more professional, efficient operation.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Either way:</strong> Choose software with a clear upgrade path so you're not stuck rebuilding your processes when you outgrow the free tier.
            </p>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 my-10">
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                Start Free, Grow When Ready
              </h3>
              <p className="text-primary-800 mb-4">
                ServiceCrew AI offers a forever-free plan for solo operators — real features, not a crippled trial. When you're ready to grow, upgrade to full features starting at just $49/month. No pressure, no contracts.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                  Start Free
                </Link>
                <Link href="/#pricing" className="inline-block bg-white text-primary-600 border border-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                  View All Plans
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
