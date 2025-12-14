'use client'

import Link from 'next/link'
import { ArrowLeftIcon, CalendarIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
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
                December 4, 2025
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                10 min read
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              How to Choose the Right Field Service Software for Your HVAC Business
            </h1>
            <p className="text-xl text-gray-600">
              A comprehensive guide to evaluating, comparing, and selecting FSM software that fits your HVAC company's needs and budget.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              Choosing field service management software is one of the most important technology decisions an HVAC contractor will make. The right choice can streamline operations, improve customer satisfaction, and boost revenue. The wrong choice can waste thousands of dollars and months of productivity.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              This guide walks you through everything you need to know to make the right decision for your HVAC business.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Step 1: Assess Your Current Needs
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Before looking at any software, understand what problems you're trying to solve:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Questions to Ask Yourself
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>How many technicians do you have? How many do you plan to have in 2-3 years?</li>
              <li>What's your biggest operational pain point right now?</li>
              <li>Are you currently using any software? What works and what doesn't?</li>
              <li>How tech-savvy are your office staff and technicians?</li>
              <li>What's your realistic budget for software?</li>
              <li>Do you need integrations with accounting software (QuickBooks, etc.)?</li>
            </ul>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
              <p className="font-semibold text-blue-900 mb-2">Pro Tip</p>
              <p className="text-blue-800">
                Make a list of your top 5 pain points. Any software you consider must address at least 3 of them out of the box.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Step 2: Understand HVAC-Specific Requirements
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Generic field service software might work, but HVAC-specific features make a big difference:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Must-Have HVAC Features
            </h3>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">Equipment Tracking</p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• Track equipment at each property</li>
                  <li>• Model numbers, serial numbers, install dates</li>
                  <li>• Warranty expiration tracking</li>
                  <li>• Service history by equipment</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">Service Agreements</p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• Maintenance contract management</li>
                  <li>• Automatic renewal reminders</li>
                  <li>• Recurring job scheduling</li>
                  <li>• Agreement revenue tracking</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">Seasonal Scheduling</p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• Handle peak season volume</li>
                  <li>• Tune-up campaign management</li>
                  <li>• Capacity planning tools</li>
                  <li>• Emergency call prioritization</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">HVAC Pricebook</p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• Flat-rate pricing support</li>
                  <li>• Good/Better/Best options</li>
                  <li>• Part and labor bundling</li>
                  <li>• Markup and margin tools</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Step 3: Evaluate Core Features
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Every FSM software should excel at these core functions:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Scheduling & Dispatch
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              This is the heart of any field service software. Look for:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Drag-and-drop scheduling:</strong> Easy to move jobs around</li>
              <li><strong>Dispatch board:</strong> See all technicians and jobs at a glance</li>
              <li><strong>Conflict detection:</strong> Warns about double-booking</li>
              <li><strong>Route optimization:</strong> Minimizes drive time between jobs</li>
              <li><strong>Real-time updates:</strong> See job status changes instantly</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Mobile App
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your technicians live on the mobile app. It must be:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Fast and responsive:</strong> Slow apps frustrate technicians</li>
              <li><strong>Works offline:</strong> Essential for basements and rural areas</li>
              <li><strong>Easy photo capture:</strong> Before/after documentation</li>
              <li><strong>Digital signatures:</strong> Customer approval on-site</li>
              <li><strong>Payment collection:</strong> Get paid before leaving</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Invoicing & Payments
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Professional invoice templates:</strong> Branded, itemized invoices</li>
              <li><strong>Instant invoicing:</strong> Send invoices from the field</li>
              <li><strong>Multiple payment options:</strong> Credit card, ACH, financing</li>
              <li><strong>Payment tracking:</strong> See outstanding balances</li>
              <li><strong>Automatic reminders:</strong> Follow up on unpaid invoices</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Customer Management
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Complete customer history:</strong> All interactions in one place</li>
              <li><strong>Property information:</strong> Multiple properties per customer</li>
              <li><strong>Communication log:</strong> Calls, emails, texts tracked</li>
              <li><strong>Notes and alerts:</strong> Important info technicians need to know</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Step 4: Consider Advanced Features
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Depending on your size and goals, these features add significant value:
            </p>

            <div className="space-y-4 my-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">AI-Powered Dispatch</p>
                <p className="text-gray-600 text-sm mt-1">Automatically assigns the best technician based on skills, location, and availability. Saves dispatcher time and improves efficiency.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">Inventory Management</p>
                <p className="text-gray-600 text-sm mt-1">Track parts on trucks and in warehouse. Know when to reorder. Reduce truck stock-outs.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">Reporting & Analytics</p>
                <p className="text-gray-600 text-sm mt-1">Track KPIs like revenue per technician, average ticket, close rate. Data-driven decisions.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">Integrations</p>
                <p className="text-gray-600 text-sm mt-1">QuickBooks sync, marketing tools, review platforms. Your software should work with your existing tools.</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Step 5: Evaluate Pricing Models
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Understand the true cost before committing:
            </p>

            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Pricing Model</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Pros</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Cons</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Flat Rate</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">Predictable costs, scales well</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">May pay for unused capacity if small</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Per-User</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">Pay for what you use</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">Expensive as you grow, punishes hiring</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Per-Technician</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">Aligns with revenue</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">Very expensive at scale</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2 font-medium">Tiered</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">Clear upgrade path</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">May hit tier limits unexpectedly</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-6 my-8">
              <p className="text-green-800 font-semibold mb-2">Recommendation</p>
              <p className="text-green-700">
                For most HVAC contractors, flat-rate or tiered pricing with generous user limits offers the best value. Avoid per-technician pricing if you plan to grow.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Step 6: Test Before You Commit
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Never buy software without trying it first:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              During Your Trial
            </h3>
            <ol className="list-decimal pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Create real jobs:</strong> Schedule actual appointments</li>
              <li><strong>Test the mobile app:</strong> Have technicians use it in the field</li>
              <li><strong>Create invoices:</strong> See how they look to customers</li>
              <li><strong>Try the dispatch board:</strong> Can you easily manage the day?</li>
              <li><strong>Test integrations:</strong> Does it sync with QuickBooks correctly?</li>
              <li><strong>Contact support:</strong> How fast and helpful are they?</li>
            </ol>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Questions to Answer During Trial
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Can your least tech-savvy employee figure it out?</li>
              <li>Does it speed up or slow down your current processes?</li>
              <li>Are there any deal-breaker missing features?</li>
              <li>How does support respond when you have questions?</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Step 7: Plan for Implementation
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              A successful software rollout requires planning:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Data migration:</strong> How will you move customer data?</li>
              <li><strong>Training:</strong> Schedule time for team training</li>
              <li><strong>Gradual rollout:</strong> Consider starting with one team or service type</li>
              <li><strong>Backup plan:</strong> Keep your old system accessible during transition</li>
              <li><strong>Success metrics:</strong> How will you measure if it's working?</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Your Software Selection Checklist
            </h2>
            <div className="bg-gray-50 rounded-xl p-6 my-6">
              <div className="space-y-3">
                {[
                  'Handles HVAC-specific needs (equipment, agreements, seasonal)',
                  'Core features work well (scheduling, dispatch, mobile, invoicing)',
                  'Pricing fits your budget now and as you grow',
                  'No long-term contracts or excessive setup fees',
                  'Free trial available (14+ days)',
                  'Mobile app works offline',
                  'Integrates with your accounting software',
                  'Support is responsive and helpful',
                  'Your team can learn it quickly',
                  'Positive reviews from other HVAC contractors'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 my-10">
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                Built for HVAC Contractors
              </h3>
              <p className="text-primary-800 mb-4">
                ServiceCrew AI was designed specifically for HVAC, plumbing, and electrical contractors. Equipment tracking, service agreements, seasonal scheduling, flat-rate pricebooks — all built in. Start your free 14-day trial and see how it fits your business.
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
