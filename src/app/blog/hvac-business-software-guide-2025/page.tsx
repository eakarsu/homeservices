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
                HVAC
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                December 1, 2025
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                12 min read
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              HVAC Business Management: Complete Software Guide for 2025
            </h1>
            <p className="text-xl text-gray-600">
              Everything HVAC contractors need to know about business management software — from scheduling to service agreements to profitability tracking.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              Running a successful HVAC business in 2025 requires more than technical expertise. You need systems to manage scheduling, dispatch, invoicing, inventory, customer relationships, and more. The right software can be the difference between struggling and thriving.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              This comprehensive guide covers everything HVAC contractors need to know about business management software.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The HVAC Business Challenge
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              HVAC contractors face unique operational challenges:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Seasonal demand swings:</strong> Crazy busy in summer and winter, slower in spring and fall</li>
              <li><strong>Emergency calls:</strong> 24/7 availability expectations from customers</li>
              <li><strong>Complex equipment:</strong> Tracking different systems at each property</li>
              <li><strong>Service agreements:</strong> Managing recurring maintenance contracts</li>
              <li><strong>Regulatory requirements:</strong> EPA certifications, permits, inspections</li>
              <li><strong>Inventory complexity:</strong> Thousands of parts across many equipment brands</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Essential Software Features for HVAC
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              1. Scheduling & Dispatch
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              The core of any HVAC operation. Your scheduling system must handle:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Visual dispatch board:</strong> See all technicians and jobs at a glance</li>
              <li><strong>Drag-and-drop scheduling:</strong> Easily move and reassign jobs</li>
              <li><strong>Skill-based routing:</strong> Match techs with jobs they're qualified for</li>
              <li><strong>Emergency call handling:</strong> Quickly slot in priority calls</li>
              <li><strong>Capacity planning:</strong> See availability and prevent overbooking</li>
            </ul>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
              <p className="font-semibold text-blue-900 mb-2">HVAC-Specific Need</p>
              <p className="text-blue-800">
                Your scheduling system should understand that a furnace install takes longer than a tune-up, and that some techs are certified for certain brands while others aren't.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              2. Equipment Tracking
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              HVAC is equipment-centric. Every property has systems you need to track:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Equipment records:</strong> Brand, model, serial number, install date</li>
              <li><strong>Service history:</strong> All work performed on each unit</li>
              <li><strong>Warranty tracking:</strong> Know when warranties expire</li>
              <li><strong>Replacement forecasting:</strong> Identify aging equipment</li>
              <li><strong>Photos:</strong> Before/after documentation</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              3. Service Agreements
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Maintenance agreements are the lifeblood of profitable HVAC companies:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Agreement management:</strong> Track all active contracts</li>
              <li><strong>Automatic renewals:</strong> Never let an agreement lapse</li>
              <li><strong>Visit scheduling:</strong> Auto-schedule seasonal tune-ups</li>
              <li><strong>Revenue tracking:</strong> See recurring revenue at a glance</li>
              <li><strong>Member benefits:</strong> Apply discounts automatically</li>
            </ul>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
              <p className="font-semibold text-green-900 mb-2">Revenue Impact</p>
              <p className="text-green-800">
                HVAC companies with strong service agreement programs typically have 30-50% of revenue as recurring. This smooths seasonal fluctuations and increases company valuation.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              4. Flat-Rate Pricing & Pricebook
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Modern HVAC companies use flat-rate pricing. Your software should support:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Digital pricebook:</strong> All services and parts with preset prices</li>
              <li><strong>Good/Better/Best options:</strong> Present tiered choices to customers</li>
              <li><strong>Automatic calculations:</strong> Parts + labor + markup = price</li>
              <li><strong>Field access:</strong> Techs can price jobs accurately on-site</li>
              <li><strong>Margin protection:</strong> Ensure profitability on every job</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              5. Mobile App for Technicians
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your techs need powerful tools in the field:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Job details:</strong> Customer info, equipment history, notes</li>
              <li><strong>Navigation:</strong> Turn-by-turn directions to job site</li>
              <li><strong>Time tracking:</strong> Clock in/out, track job time</li>
              <li><strong>Photo documentation:</strong> Before/after photos, equipment data plates</li>
              <li><strong>Pricebook access:</strong> Build quotes on-site</li>
              <li><strong>Digital signatures:</strong> Customer approval before leaving</li>
              <li><strong>Payment collection:</strong> Credit card, ACH, financing</li>
              <li><strong>Offline mode:</strong> Works in basements without signal</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              6. Customer Communication
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Appointment confirmations:</strong> Auto-send when job is booked</li>
              <li><strong>Reminder notifications:</strong> Day-before and morning-of reminders</li>
              <li><strong>"On my way" alerts:</strong> Real-time tech ETA</li>
              <li><strong>Post-job follow-up:</strong> Thank you and review requests</li>
              <li><strong>Maintenance reminders:</strong> Seasonal tune-up notifications</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              7. Inventory Management
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Track parts on trucks and in the warehouse:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Truck inventory:</strong> What's on each vehicle</li>
              <li><strong>Warehouse stock:</strong> Central inventory levels</li>
              <li><strong>Automatic deductions:</strong> Parts used on jobs reduce inventory</li>
              <li><strong>Reorder alerts:</strong> Know when to restock</li>
              <li><strong>Cost tracking:</strong> Know your true cost per job</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              8. Invoicing & Payments
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Professional invoices:</strong> Branded, itemized, easy to understand</li>
              <li><strong>On-site invoicing:</strong> Generate and send before leaving</li>
              <li><strong>Multiple payment methods:</strong> Card, ACH, check, financing</li>
              <li><strong>Payment tracking:</strong> See outstanding balances</li>
              <li><strong>Automatic reminders:</strong> Follow up on unpaid invoices</li>
              <li><strong>Accounting sync:</strong> Integration with QuickBooks</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              9. Reporting & Analytics
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Make data-driven decisions with:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Revenue reports:</strong> By tech, service type, time period</li>
              <li><strong>Technician performance:</strong> Jobs completed, average ticket, close rate</li>
              <li><strong>Service agreement metrics:</strong> Renewal rates, revenue, visits scheduled</li>
              <li><strong>Job profitability:</strong> Which services make you money</li>
              <li><strong>Customer insights:</strong> Top customers, at-risk accounts</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Nice-to-Have Features
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Beyond the essentials, these features add significant value:
            </p>

            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">AI Dispatch</p>
                <p className="text-gray-600 text-sm mt-1">Automatically assigns the optimal tech based on skills, location, and availability.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">AI Diagnostics</p>
                <p className="text-gray-600 text-sm mt-1">Helps techs troubleshoot unfamiliar equipment or error codes.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">Route Optimization</p>
                <p className="text-gray-600 text-sm mt-1">Minimizes drive time between jobs automatically.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">Marketing Tools</p>
                <p className="text-gray-600 text-sm mt-1">Email campaigns, review management, referral tracking.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">Financing Integration</p>
                <p className="text-gray-600 text-sm mt-1">Offer customer financing for large replacements.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">Call Tracking</p>
                <p className="text-gray-600 text-sm mt-1">Track which marketing sources generate calls.</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Software Pricing for HVAC Companies
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              What should you expect to pay? Here's a breakdown by company size:
            </p>

            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Company Size</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Reasonable Cost</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">What to Expect</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">1 tech (solo)</td>
                    <td className="border border-gray-200 px-4 py-2">$0-50/mo</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">Basic scheduling, invoicing, mobile app</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">2-5 techs</td>
                    <td className="border border-gray-200 px-4 py-2">$50-150/mo</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">Full features, dispatch board, reporting</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">6-15 techs</td>
                    <td className="border border-gray-200 px-4 py-2">$100-300/mo</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">AI features, inventory, advanced reporting</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">16-50 techs</td>
                    <td className="border border-gray-200 px-4 py-2">$200-500/mo</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">Multi-location, API access, priority support</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 my-8">
              <p className="text-amber-800 font-semibold mb-2">Avoid Per-Technician Pricing</p>
              <p className="text-amber-700">
                Enterprise software charging $250-500/tech/month quickly becomes unaffordable. A 10-tech shop at $300/tech = $3,000/month = $36,000/year. That's often more than modern all-inclusive alternatives.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Implementation Best Practices
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Getting the most from your HVAC software requires proper implementation:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Before You Start
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Clean up your customer list (remove duplicates, update contacts)</li>
              <li>Document your current processes</li>
              <li>List all equipment brands you service</li>
              <li>Prepare your pricebook (services and pricing)</li>
              <li>Identify your power users who will lead training</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              During Rollout
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Start with office staff before technicians</li>
              <li>Run parallel systems for 1-2 weeks if possible</li>
              <li>Train in small groups, not all at once</li>
              <li>Have a go-to person for questions</li>
              <li>Celebrate early wins to build momentum</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Ongoing Success
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Review reports weekly — use the data</li>
              <li>Refine processes based on what you learn</li>
              <li>Keep pricebook updated quarterly</li>
              <li>Train new hires thoroughly</li>
              <li>Stay updated on new features</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Measuring Success
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              After implementing software, track these metrics to measure ROI:
            </p>
            <div className="bg-gray-50 rounded-xl p-6 my-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Efficiency Metrics</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Jobs per tech per day</li>
                    <li>• Average drive time between jobs</li>
                    <li>• Dispatcher time per job booked</li>
                    <li>• Invoice processing time</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Revenue Metrics</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Average ticket value</li>
                    <li>• Service agreement revenue</li>
                    <li>• Conversion rate (estimates to jobs)</li>
                    <li>• Revenue per technician</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Conclusion
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              The right business management software is no longer optional for HVAC contractors — it's essential for competing in 2025. The good news is that powerful, HVAC-specific software is now available at prices that work for companies of all sizes.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Focus on finding software that handles your HVAC-specific needs (equipment tracking, service agreements, seasonal scheduling), offers transparent pricing, and doesn't require a long-term commitment. Then implement it properly and use the data to continuously improve your operations.
            </p>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 my-10">
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                Built for HVAC Success
              </h3>
              <p className="text-primary-800 mb-4">
                ServiceCrew AI was designed specifically for HVAC contractors. Equipment tracking, service agreements, seasonal scheduling, flat-rate pricebooks, and AI-powered dispatch — all included in one simple price. Start your free 14-day trial today.
              </p>
              <Link href="/register" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                Start Your Free Trial
              </Link>
            </div>
          </div>
        </article>
      </main>

      <PublicFooter />
    </div>
  )
}
