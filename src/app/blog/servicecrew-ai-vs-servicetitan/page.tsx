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
                Comparison
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                November 26, 2025
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                10 min read
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ServiceCrew AI vs ServiceTitan: Full Comparison for 2025
            </h1>
            <p className="text-xl text-gray-600">
              An honest, feature-by-feature comparison to help you decide which field service software is right for your contracting business.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              ServiceTitan is the industry giant. ServiceCrew AI is the modern challenger. Both promise to streamline your field service operations — but they take very different approaches to pricing, features, and who they serve best.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              This comparison will help you understand the real differences and make the right choice for your business.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The Quick Summary
            </h2>
            <div className="grid md:grid-cols-2 gap-6 my-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="font-bold text-gray-900 text-lg mb-3">ServiceTitan</p>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>✓ Industry leader with most features</li>
                  <li>✓ Best for large companies (25+ techs)</li>
                  <li>✓ Extensive integrations ecosystem</li>
                  <li>✗ $245-500 per technician per month</li>
                  <li>✗ $5,000-50,000+ setup fees</li>
                  <li>✗ 12-24 month contracts required</li>
                  <li>✗ Complex, steep learning curve</li>
                </ul>
              </div>
              <div className="bg-primary-50 rounded-xl p-6 border-2 border-primary-500">
                <p className="font-bold text-primary-900 text-lg mb-3">ServiceCrew AI</p>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>✓ All core features included</li>
                  <li>✓ Best for small-mid size (1-50 techs)</li>
                  <li>✓ AI features built-in (not add-ons)</li>
                  <li>✓ Flat pricing: $0-199/month total</li>
                  <li>✓ $0 setup fees</li>
                  <li>✓ No contracts, cancel anytime</li>
                  <li>✓ Simple, quick to learn</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Pricing Comparison
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              This is where the platforms differ most dramatically.
            </p>

            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-3 text-left">Cost Type</th>
                    <th className="border border-gray-200 px-4 py-3 text-left">ServiceTitan</th>
                    <th className="border border-gray-200 px-4 py-3 text-left bg-primary-50">ServiceCrew AI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">Pricing Model</td>
                    <td className="border border-gray-200 px-4 py-3">Per technician/month</td>
                    <td className="border border-gray-200 px-4 py-3 bg-primary-50">Flat monthly rate</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">Starting Price</td>
                    <td className="border border-gray-200 px-4 py-3">~$245/tech/month</td>
                    <td className="border border-gray-200 px-4 py-3 bg-primary-50">$0/month (free tier)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">5-Tech Cost</td>
                    <td className="border border-gray-200 px-4 py-3 text-red-600">$1,225+/month</td>
                    <td className="border border-gray-200 px-4 py-3 bg-primary-50 text-green-600">$99/month</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">10-Tech Cost</td>
                    <td className="border border-gray-200 px-4 py-3 text-red-600">$2,450+/month</td>
                    <td className="border border-gray-200 px-4 py-3 bg-primary-50 text-green-600">$99/month</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">20-Tech Cost</td>
                    <td className="border border-gray-200 px-4 py-3 text-red-600">$4,900+/month</td>
                    <td className="border border-gray-200 px-4 py-3 bg-primary-50 text-green-600">$199/month</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">Setup Fee</td>
                    <td className="border border-gray-200 px-4 py-3">$5,000-50,000+</td>
                    <td className="border border-gray-200 px-4 py-3 bg-primary-50">$0</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-3 font-medium">Contract</td>
                    <td className="border border-gray-200 px-4 py-3">12-24 months</td>
                    <td className="border border-gray-200 px-4 py-3 bg-primary-50">None (month-to-month)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
              <p className="font-semibold text-green-900 mb-2">Annual Savings Example</p>
              <p className="text-green-800">
                A 10-technician company pays approximately $29,400/year with ServiceTitan vs. $1,188/year with ServiceCrew AI — a savings of <strong>$28,212 per year</strong>.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Feature Comparison
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Here's how the platforms compare on core features:
            </p>

            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left">Feature</th>
                    <th className="border border-gray-200 px-3 py-2 text-center">ServiceTitan</th>
                    <th className="border border-gray-200 px-3 py-2 text-center bg-primary-50">ServiceCrew AI</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Scheduling & Dispatch', titan: true, crew: true },
                    { feature: 'Dispatch Board', titan: true, crew: true },
                    { feature: 'Mobile App (iOS/Android)', titan: true, crew: true },
                    { feature: 'Customer Management', titan: true, crew: true },
                    { feature: 'Estimates & Invoicing', titan: true, crew: true },
                    { feature: 'Good/Better/Best Pricing', titan: true, crew: true },
                    { feature: 'Digital Signatures', titan: true, crew: true },
                    { feature: 'Payment Processing', titan: true, crew: true },
                    { feature: 'GPS Tracking', titan: true, crew: true },
                    { feature: 'Inventory Management', titan: true, crew: true },
                    { feature: 'Service Agreements', titan: true, crew: true },
                    { feature: 'Reporting & Analytics', titan: true, crew: true },
                    { feature: 'QuickBooks Integration', titan: true, crew: true },
                    { feature: 'AI-Powered Dispatch', titan: 'Add-on', crew: true },
                    { feature: 'AI Diagnostics', titan: false, crew: true },
                    { feature: 'AI Quote Generator', titan: false, crew: true },
                    { feature: 'Free Plan Available', titan: false, crew: true },
                    { feature: 'No Contract Required', titan: false, crew: true },
                    { feature: 'Marketing Tools', titan: true, crew: 'Coming Soon' },
                    { feature: 'Call Recording', titan: true, crew: 'Coming Soon' },
                    { feature: 'Extensive API', titan: true, crew: true },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="border border-gray-200 px-3 py-2">{row.feature}</td>
                      <td className="border border-gray-200 px-3 py-2 text-center">
                        {row.titan === true ? (
                          <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : row.titan === false ? (
                          <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                        ) : (
                          <span className="text-gray-500 text-xs">{row.titan}</span>
                        )}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-center bg-primary-50">
                        {row.crew === true ? (
                          <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : row.crew === false ? (
                          <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                        ) : (
                          <span className="text-gray-500 text-xs">{row.crew}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              When to Choose ServiceTitan
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ServiceTitan may be the right choice if:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>You have 25+ technicians</strong> — ServiceTitan's enterprise features shine at scale</li>
              <li><strong>You need specific integrations</strong> — They have the largest partner ecosystem</li>
              <li><strong>You want marketing tools built-in</strong> — Call tracking, email marketing, reputation management</li>
              <li><strong>Budget isn't a primary concern</strong> — You can afford $3,000-10,000+/month for software</li>
              <li><strong>You have dedicated operations staff</strong> — To manage the complexity</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              When to Choose ServiceCrew AI
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ServiceCrew AI is the better choice if:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>You have 1-50 technicians</strong> — Perfect for small to mid-size contractors</li>
              <li><strong>Cost is important</strong> — Save $20,000-50,000+/year vs. enterprise software</li>
              <li><strong>You want simplicity</strong> — Up and running in hours, not weeks</li>
              <li><strong>You don't want contracts</strong> — Month-to-month flexibility</li>
              <li><strong>You want AI features included</strong> — Not expensive add-ons</li>
              <li><strong>You're price-conscious but feature-hungry</strong> — Get enterprise features at SMB prices</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              User Experience Comparison
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Learning Curve
            </h3>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">ServiceTitan</p>
                <p className="text-gray-700 text-sm">
                  Steep learning curve. Most companies report 4-8 weeks to become proficient. Requires dedicated training and often ongoing support. Full implementation can take 2-4 months.
                </p>
              </div>
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="font-semibold text-primary-900 mb-2">ServiceCrew AI</p>
                <p className="text-gray-700 text-sm">
                  Designed for simplicity. Most users are comfortable within 1-2 days. Intuitive interface requires minimal training. Full implementation in 1-2 weeks.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Mobile App
            </h3>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">ServiceTitan</p>
                <p className="text-gray-700 text-sm">
                  Powerful but complex. Many features require multiple taps to access. Some technicians find it overwhelming.
                </p>
              </div>
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="font-semibold text-primary-900 mb-2">ServiceCrew AI</p>
                <p className="text-gray-700 text-sm">
                  Streamlined for field use. Most common actions are 1-2 taps away. Works offline for basement and rural jobs.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Support Comparison
            </h2>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">ServiceTitan</p>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Dedicated success manager (enterprise)</li>
                  <li>• Phone and chat support</li>
                  <li>• Extensive knowledge base</li>
                  <li>• User community forums</li>
                  <li>• Support quality varies by tier</li>
                </ul>
              </div>
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="font-semibold text-primary-900 mb-2">ServiceCrew AI</p>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• All customers get same support level</li>
                  <li>• Chat, email, and phone support</li>
                  <li>• Help documentation and videos</li>
                  <li>• Fast response times</li>
                  <li>• No support tiers — everyone gets priority</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Real Cost Analysis: 3-Year View
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Let's look at the total cost of ownership over 3 years for a 10-technician company:
            </p>

            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Cost</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">ServiceTitan</th>
                    <th className="border border-gray-200 px-4 py-2 text-right bg-primary-50">ServiceCrew AI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Setup Fee</td>
                    <td className="border border-gray-200 px-4 py-2 text-right">$15,000</td>
                    <td className="border border-gray-200 px-4 py-2 text-right bg-primary-50">$0</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Year 1 Subscription</td>
                    <td className="border border-gray-200 px-4 py-2 text-right">$29,400</td>
                    <td className="border border-gray-200 px-4 py-2 text-right bg-primary-50">$1,188</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Year 2 Subscription</td>
                    <td className="border border-gray-200 px-4 py-2 text-right">$31,164</td>
                    <td className="border border-gray-200 px-4 py-2 text-right bg-primary-50">$1,188</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Year 3 Subscription</td>
                    <td className="border border-gray-200 px-4 py-2 text-right">$33,034</td>
                    <td className="border border-gray-200 px-4 py-2 text-right bg-primary-50">$1,188</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Training (estimated)</td>
                    <td className="border border-gray-200 px-4 py-2 text-right">$5,000</td>
                    <td className="border border-gray-200 px-4 py-2 text-right bg-primary-50">$0</td>
                  </tr>
                  <tr className="font-bold">
                    <td className="border border-gray-200 px-4 py-2">3-Year Total</td>
                    <td className="border border-gray-200 px-4 py-2 text-right text-red-600">$113,598</td>
                    <td className="border border-gray-200 px-4 py-2 text-right bg-primary-50 text-green-600">$3,564</td>
                  </tr>
                  <tr className="font-bold bg-green-50">
                    <td className="border border-gray-200 px-4 py-2">Savings with ServiceCrew AI</td>
                    <td className="border border-gray-200 px-4 py-2" colSpan={2}>
                      <span className="text-green-600 text-lg">$110,034 over 3 years</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-gray-600 text-sm italic mb-6">
              * ServiceTitan pricing estimated at $245/tech/month with 6% annual increases. Actual pricing varies.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The Verdict
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              ServiceTitan is a powerful platform built for large enterprises with large budgets. If you have 50+ technicians, dedicated IT staff, and software budget isn't a concern, it's a solid choice.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              For the vast majority of contractors — those with 1-50 technicians who want powerful features without enterprise complexity and costs — ServiceCrew AI delivers more value. You get the core features that drive your business, plus AI capabilities that ServiceTitan charges extra for, at a fraction of the price.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              The savings are real. The features are comparable. The choice is yours.
            </p>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 my-10">
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                See For Yourself
              </h3>
              <p className="text-primary-800 mb-4">
                Try ServiceCrew AI free for 14 days — no credit card required, no commitment. See how it compares to what you're paying now.
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
