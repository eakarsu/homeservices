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
                Plumbing
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                November 30, 2025
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                10 min read
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Plumbing Business Software: What Features Actually Matter
            </h1>
            <p className="text-xl text-gray-600">
              A plumber's guide to choosing software that handles the unique demands of plumbing businesses — from emergency calls to drain cleaning to whole-house repiping.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              Plumbing businesses have unique operational needs that generic field service software often misses. From 24/7 emergency service to complex estimation for large projects, plumbers need tools built for their specific challenges.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Unique Challenges in Plumbing Operations
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Before diving into features, let's understand what makes plumbing different:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Emergency-driven demand:</strong> A large portion of calls are urgent (leaks, clogs, no hot water)</li>
              <li><strong>Variable job duration:</strong> A simple faucet fix vs. whole-house repipe can differ by days</li>
              <li><strong>Permit requirements:</strong> Many jobs require permits and inspections</li>
              <li><strong>Multiple service types:</strong> Drain cleaning, repairs, installations, water heaters, sewer lines</li>
              <li><strong>Specialized equipment:</strong> Camera inspections, hydro-jetting, trenchless equipment</li>
              <li><strong>Inventory complexity:</strong> Hundreds of fittings, fixtures, and parts</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Must-Have Features for Plumbing Companies
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              1. Emergency Call Management
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Plumbing emergencies can't wait. Your software needs:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Priority flagging:</strong> Mark emergency calls for immediate attention</li>
              <li><strong>Quick dispatch:</strong> Find and assign the nearest available tech in seconds</li>
              <li><strong>On-call rotation:</strong> Manage after-hours tech schedules</li>
              <li><strong>Customer notification:</strong> Automatic ETA updates for anxious customers</li>
              <li><strong>Premium pricing:</strong> Apply after-hours or emergency rates automatically</li>
            </ul>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
              <p className="font-semibold text-blue-900 mb-2">Response Time Matters</p>
              <p className="text-blue-800">
                Studies show that customers calling with a plumbing emergency will call multiple companies. The first one to answer and give a clear ETA usually gets the job. Fast dispatch is revenue.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              2. Job Type Flexibility
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Plumbing jobs vary wildly in scope and duration:
            </p>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">Quick Service Calls</p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• Drain cleaning: 30-60 min</li>
                  <li>• Faucet repair: 30-60 min</li>
                  <li>• Toilet repair: 30-90 min</li>
                  <li>• Garbage disposal: 30-60 min</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">Large Projects</p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• Water heater install: 2-4 hours</li>
                  <li>• Bathroom rough-in: 1-2 days</li>
                  <li>• Whole-house repipe: 2-5 days</li>
                  <li>• Sewer line replacement: 1-3 days</li>
                </ul>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              Your software should handle both a 30-minute drain cleaning and a week-long construction project with equal ease.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              3. Photo & Video Documentation
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Visual documentation is critical in plumbing:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Before/after photos:</strong> Proof of work completed</li>
              <li><strong>Camera inspection videos:</strong> Attach sewer camera footage to job records</li>
              <li><strong>Problem documentation:</strong> Show customers what's wrong</li>
              <li><strong>Permit photos:</strong> Document code-required work</li>
              <li><strong>Easy attachment:</strong> Take photos directly from mobile app</li>
            </ul>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
              <p className="font-semibold text-green-900 mb-2">Sales Tool</p>
              <p className="text-green-800">
                Showing a customer video of their corroded pipe or root-infested sewer line is the most effective sales tool in plumbing. Make sure your software makes capturing and sharing this content easy.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              4. Detailed Estimating
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Plumbing estimates can be complex. You need:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Good/Better/Best options:</strong> Repair vs. replace, standard vs. premium fixtures</li>
              <li><strong>Line-item detail:</strong> Parts, labor, permits itemized</li>
              <li><strong>Multiple options:</strong> Present different solutions in one estimate</li>
              <li><strong>Digital signatures:</strong> Get approval on-site</li>
              <li><strong>Financing options:</strong> Integrate financing for big-ticket items</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              5. Flat-Rate Pricebook
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              A comprehensive pricebook ensures consistent pricing:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Task-based pricing:</strong> Standard prices for common jobs</li>
              <li><strong>Parts pricing:</strong> Markup built into part prices</li>
              <li><strong>Service categories:</strong> Drain, water heater, fixtures, sewer, etc.</li>
              <li><strong>Mobile access:</strong> Techs price jobs accurately in the field</li>
              <li><strong>Easy updates:</strong> Adjust prices as costs change</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              6. Inventory Management
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Plumbers carry extensive truck inventory:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Truck stock tracking:</strong> Know what's on each vehicle</li>
              <li><strong>Auto-deduction:</strong> Parts used on jobs reduce inventory</li>
              <li><strong>Reorder alerts:</strong> Never run out of common parts</li>
              <li><strong>Transfer tracking:</strong> Move parts between trucks or warehouse</li>
              <li><strong>Cost tracking:</strong> Know your true cost per job</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              7. Service History Access
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              When a tech arrives at a property, they should instantly see:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>All previous service calls at this address</li>
              <li>What was done and what was recommended</li>
              <li>Photos and notes from previous visits</li>
              <li>Customer preferences and special instructions</li>
              <li>Outstanding quotes that weren't accepted</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Plumbing-Specific Workflows
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Drain Cleaning Workflow
            </h3>
            <div className="bg-gray-50 rounded-xl p-6 my-6">
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Emergency call comes in — customer has backed-up drain</li>
                <li>Dispatcher finds nearest tech with drain equipment</li>
                <li>Tech dispatched, customer gets ETA notification</li>
                <li>Tech arrives, assesses situation, runs camera</li>
                <li>Camera video attached to job, shows to customer</li>
                <li>Tech presents options: snaking, hydro-jetting, or repair</li>
                <li>Customer approves on tablet</li>
                <li>Work completed, before/after photos taken</li>
                <li>Invoice generated and paid on-site</li>
                <li>Follow-up email sent with maintenance recommendations</li>
              </ol>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Water Heater Replacement Workflow
            </h3>
            <div className="bg-gray-50 rounded-xl p-6 my-6">
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Service call for "no hot water"</li>
                <li>Tech diagnoses — unit needs replacement</li>
                <li>Tech pulls up Good/Better/Best water heater options</li>
                <li>Customer selects option, signs estimate on tablet</li>
                <li>Tech checks truck inventory for equipment</li>
                <li>If available: install same day</li>
                <li>If not: schedule installation, order equipment</li>
                <li>Permit filed if required</li>
                <li>Installation completed, photos taken</li>
                <li>Customer pays, warranty information provided</li>
              </ol>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Features That Increase Plumbing Revenue
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Membership Programs
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Unlike HVAC, plumbing doesn't have seasonal tune-ups. But membership programs still work:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Annual water heater flush</li>
              <li>Priority emergency service</li>
              <li>Discounts on repairs</li>
              <li>Free drain cleaning annually</li>
              <li>Extended warranty on work</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Upsell Prompts
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Good software reminds techs of upsell opportunities:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Water heater age prompts replacement discussion</li>
              <li>Older homes prompt repipe assessment</li>
              <li>Drain calls prompt camera inspection offer</li>
              <li>Fixture repairs prompt upgrade options</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              What Plumbers Don't Need
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Avoid paying for features that don't apply to plumbing:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Complex equipment tracking:</strong> Plumbers don't track customer equipment like HVAC</li>
              <li><strong>Seasonal scheduling:</strong> Plumbing is year-round, not seasonal</li>
              <li><strong>Commission tracking:</strong> Most plumbers don't work on commission</li>
              <li><strong>Multi-day project management:</strong> Unless you do construction/remodel work</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Pricing Considerations for Plumbers
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              What should a plumbing company expect to pay?
            </p>

            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Company Size</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Reasonable Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">1-2 plumbers</td>
                    <td className="border border-gray-200 px-4 py-2">$0-75/month</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">3-5 plumbers</td>
                    <td className="border border-gray-200 px-4 py-2">$75-150/month</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">6-15 plumbers</td>
                    <td className="border border-gray-200 px-4 py-2">$100-250/month</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">15+ plumbers</td>
                    <td className="border border-gray-200 px-4 py-2">$200-500/month</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 my-8">
              <p className="text-amber-800 font-semibold mb-2">Warning</p>
              <p className="text-amber-700">
                Avoid per-technician pricing. Plumbing companies often have helpers and apprentices who don't need full access. Per-tech pricing makes adding staff unnecessarily expensive.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The Bottom Line
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Plumbing businesses need software that handles emergency dispatch quickly, supports detailed estimating with options, manages extensive parts inventory, and makes photo/video documentation easy.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Don't overpay for HVAC-specific features you won't use. Find software that handles the plumbing workflow naturally and scales with your team without per-technician fees eating into your margins.
            </p>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 my-10">
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                Built for Plumbers
              </h3>
              <p className="text-primary-800 mb-4">
                ServiceCrew AI handles the unique needs of plumbing businesses — emergency dispatch, detailed estimating, photo documentation, inventory tracking — all at a flat monthly rate with no per-technician fees.
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
