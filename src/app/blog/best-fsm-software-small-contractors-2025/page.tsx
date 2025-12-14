'use client'

import Link from 'next/link'
import { ArrowLeftIcon, CalendarIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline'
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
                Software Reviews
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                November 24, 2025
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                12 min read
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Best Field Service Software for Small Contractors (2025)
            </h1>
            <p className="text-xl text-gray-600">
              Our picks for the best FSM software for contractors with 1-20 technicians — with honest pros, cons, and pricing for each option.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              Small contractors have different needs than enterprises. You need powerful features without complexity, fair pricing without per-technician fees eating your margins, and software that helps rather than hinders your growth.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              We've evaluated the top field service management platforms for small contractors in 2025. Here are our picks.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 my-8">
              <p className="font-semibold text-blue-900 mb-2">How We Evaluated</p>
              <p className="text-blue-800 text-sm">
                We looked at features, pricing transparency, ease of use, mobile app quality, customer support, and value for money. We focused specifically on needs of small contractors (1-20 technicians) in HVAC, plumbing, and electrical.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              1. ServiceCrew AI — Best Overall for Small Contractors
            </h2>
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              ))}
              <span className="text-gray-600 ml-2">5.0</span>
            </div>

            <div className="bg-primary-50 rounded-xl p-6 my-6 border border-primary-200">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Strengths</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>✓ Flat pricing (no per-tech fees)</li>
                    <li>✓ AI features included at all tiers</li>
                    <li>✓ Free plan available forever</li>
                    <li>✓ No contracts or setup fees</li>
                    <li>✓ Simple, quick to learn</li>
                    <li>✓ Excellent mobile app</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Considerations</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Newer platform (less industry history)</li>
                    <li>• Marketing tools coming soon</li>
                    <li>• Smaller integration ecosystem</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-primary-200">
                <p className="font-semibold text-gray-900">Pricing</p>
                <p className="text-gray-700 text-sm">Free: $0 (1 user) | Starter: $49/mo (3 users) | Pro: $99/mo (10 users) | Business: $199/mo (unlimited)</p>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Why we picked it:</strong> ServiceCrew AI offers the best value proposition for small contractors. You get features that competitors charge enterprise prices for — AI dispatch, smart scheduling, digital invoicing — at a flat rate that doesn't punish you for growing. The free tier is genuinely useful for solo operators, and even the Pro tier at $99/month costs less than a single technician would cost on most enterprise platforms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              2. Housecall Pro — Best for Simple Service Calls
            </h2>
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              ))}
              <StarIcon className="h-5 w-5 text-gray-300" />
              <span className="text-gray-600 ml-2">4.0</span>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 my-6 border border-gray-200">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Strengths</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>✓ Easy to use interface</li>
                    <li>✓ Good mobile app</li>
                    <li>✓ Built-in marketing tools</li>
                    <li>✓ Customer communication features</li>
                    <li>✓ Good for general handyman work</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Considerations</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Per-user pricing adds up</li>
                    <li>• Limited HVAC-specific features</li>
                    <li>• No AI capabilities</li>
                    <li>• Gets expensive with team growth</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="font-semibold text-gray-900">Pricing</p>
                <p className="text-gray-700 text-sm">Basic: $49/mo (1 user) | Essentials: $129/mo (5 users) | Max: Custom pricing</p>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Why we picked it:</strong> Housecall Pro is straightforward and easy to learn. It's a solid choice for general contractors and handymen who need basic scheduling, invoicing, and customer management without a lot of complexity. However, it lacks trade-specific features that HVAC, plumbing, and electrical contractors need.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              3. Jobber — Best for Professional Services
            </h2>
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              ))}
              <StarIcon className="h-5 w-5 text-gray-300" />
              <span className="text-gray-600 ml-2">4.0</span>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 my-6 border border-gray-200">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Strengths</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>✓ Clean, modern interface</li>
                    <li>✓ Good quote and invoice system</li>
                    <li>✓ Client hub for customers</li>
                    <li>✓ Works for many service types</li>
                    <li>✓ Solid reporting</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Considerations</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Per-user pricing</li>
                    <li>• Not trade-specific</li>
                    <li>• Limited inventory management</li>
                    <li>• No AI features</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="font-semibold text-gray-900">Pricing</p>
                <p className="text-gray-700 text-sm">Core: $49/mo (1 user) | Connect: $129/mo | Grow: $249/mo (pricing per user applies)</p>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Why we picked it:</strong> Jobber has a polished interface and works well for a variety of service businesses. Their client communication features are strong. However, like Housecall Pro, it's a generalist tool that may lack features specific to HVAC, plumbing, or electrical work.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              4. FieldEdge — Best for QuickBooks Users
            </h2>
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3].map((i) => (
                <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              ))}
              <StarIcon className="h-5 w-5 text-yellow-400 fill-yellow-400 opacity-50" />
              <StarIcon className="h-5 w-5 text-gray-300" />
              <span className="text-gray-600 ml-2">3.5</span>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 my-6 border border-gray-200">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Strengths</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>✓ Excellent QuickBooks integration</li>
                    <li>✓ Trade-specific features</li>
                    <li>✓ Service agreement management</li>
                    <li>✓ Flat-rate pricing tools</li>
                    <li>✓ Long industry history</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Considerations</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Per-user pricing model</li>
                    <li>• Interface feels dated</li>
                    <li>• Steeper learning curve</li>
                    <li>• Can get expensive</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="font-semibold text-gray-900">Pricing</p>
                <p className="text-gray-700 text-sm">Contact for pricing — typically per-user model in the $100-200/user/mo range</p>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Why we picked it:</strong> FieldEdge has been around for a long time and has deep QuickBooks integration. It's a trade-specific tool with features for HVAC and plumbing contractors. However, the interface is older, and per-user pricing makes it expensive for growing teams.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              5. ServiceM8 — Best Budget Option
            </h2>
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3].map((i) => (
                <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              ))}
              <StarIcon className="h-5 w-5 text-yellow-400 fill-yellow-400 opacity-50" />
              <StarIcon className="h-5 w-5 text-gray-300" />
              <span className="text-gray-600 ml-2">3.5</span>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 my-6 border border-gray-200">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Strengths</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>✓ Very affordable</li>
                    <li>✓ Job-based pricing (not per user)</li>
                    <li>✓ Simple to use</li>
                    <li>✓ Good for solo operators</li>
                    <li>✓ Decent mobile app</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Considerations</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Limited advanced features</li>
                    <li>• Basic reporting</li>
                    <li>• Not trade-specific</li>
                    <li>• Limited inventory management</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="font-semibold text-gray-900">Pricing</p>
                <p className="text-gray-700 text-sm">Free for very low volume | Lite: $9/mo | Starter: $29/mo | Growing: $79/mo | Premium: $149/mo</p>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Why we picked it:</strong> ServiceM8 is budget-friendly with job-based pricing rather than per-user pricing. It's a good starter option for solo operators or very small teams who need basic functionality without breaking the bank. However, you'll likely outgrow it as you scale.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Comparison Table
            </h2>
            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left">Platform</th>
                    <th className="border border-gray-200 px-3 py-2 text-center">5-Tech Cost</th>
                    <th className="border border-gray-200 px-3 py-2 text-center">Free Plan</th>
                    <th className="border border-gray-200 px-3 py-2 text-center">AI Features</th>
                    <th className="border border-gray-200 px-3 py-2 text-center">Contracts</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-primary-50">
                    <td className="border border-gray-200 px-3 py-2 font-medium">ServiceCrew AI</td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-green-600">$99/mo</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">Yes</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">Included</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">None</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 font-medium">Housecall Pro</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">$129+/mo</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">No</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">No</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">Monthly</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 font-medium">Jobber</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">$149+/mo</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">No</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">No</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">Monthly</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 font-medium">FieldEdge</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">$500+/mo</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">No</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">No</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">Annual</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 font-medium">ServiceM8</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">$79-149/mo</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">Limited</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">No</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">Monthly</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Our Recommendation
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              For small contractors in HVAC, plumbing, and electrical, <strong>ServiceCrew AI</strong> offers the best combination of features, pricing, and value. You get:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Enterprise features at small business prices</li>
              <li>AI-powered dispatch and diagnostics included</li>
              <li>Flat pricing that doesn't punish growth</li>
              <li>No contracts or setup fees</li>
              <li>A free tier to start with</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-6">
              If you're currently paying hundreds or thousands per month for software, you owe it to yourself to try ServiceCrew AI's free trial and see what you could save.
            </p>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 my-10">
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                Try the #1 Pick Free
              </h3>
              <p className="text-primary-800 mb-4">
                Start with ServiceCrew AI's free plan — no credit card required. Upgrade when you're ready. See why small contractors are making the switch.
              </p>
              <Link href="/register" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                Start Free Trial
              </Link>
            </div>
          </div>
        </article>
      </main>

      <PublicFooter />
    </div>
  )
}
