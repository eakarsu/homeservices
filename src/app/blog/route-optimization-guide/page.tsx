'use client'

import Link from 'next/link'
import { ArrowLeftIcon, CalendarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline'
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
                Operations
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                December 2, 2025
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                9 min read
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              The Ultimate Guide to Route Optimization for Service Contractors
            </h1>
            <p className="text-xl text-gray-600">
              How smart routing can save your business thousands in fuel costs, add more jobs per day, and improve customer satisfaction.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              For service contractors, time on the road is time not making money. Every unnecessary mile driven is fuel wasted, wear on vehicles increased, and jobs not completed. Route optimization is one of the fastest ways to improve your bottom line.
            </p>

            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 my-8">
              <MapPinIcon className="h-8 w-8 text-green-600 flex-shrink-0" />
              <p className="text-green-800 font-medium">
                The average service contractor can reduce drive time by 20-30% with proper route optimization — that's 1-2 extra jobs per technician per day.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              What is Route Optimization?
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Route optimization goes beyond basic GPS navigation. It's the process of determining the most efficient order to complete multiple jobs while considering constraints like:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Customer appointment windows</li>
              <li>Traffic patterns at different times of day</li>
              <li>Job duration and type</li>
              <li>Technician skills and certifications</li>
              <li>Parts availability on trucks</li>
              <li>Emergency calls and schedule changes</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The Real Cost of Poor Routing
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Let's do the math on what inefficient routing costs your business:
            </p>

            <div className="bg-gray-50 rounded-xl p-6 my-6">
              <p className="font-semibold text-gray-900 mb-4">Cost Analysis: 5-Tech Company</p>
              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span>Average unnecessary miles per tech per day:</span>
                  <span className="font-semibold">25 miles</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span>Total unnecessary miles per day (5 techs):</span>
                  <span className="font-semibold">125 miles</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span>Annual unnecessary miles (250 work days):</span>
                  <span className="font-semibold">31,250 miles</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span>Fuel cost @ $0.20/mile:</span>
                  <span className="font-semibold text-red-600">$6,250/year</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span>Vehicle wear @ $0.15/mile:</span>
                  <span className="font-semibold text-red-600">$4,687/year</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span>Lost productivity (30 min/tech/day @ $50/hr):</span>
                  <span className="font-semibold text-red-600">$31,250/year</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-bold">Total Annual Cost of Poor Routing:</span>
                  <span className="font-bold text-red-600">$42,187/year</span>
                </div>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              And this doesn't include the opportunity cost of jobs you couldn't fit into the schedule because techs were stuck in traffic.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Key Components of Route Optimization
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              1. Geographic Clustering
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              The foundation of good routing is keeping technicians in defined geographic areas. This reduces travel time between jobs dramatically.
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Divide your service area into zones</li>
              <li>Assign technicians to zones when possible</li>
              <li>Schedule jobs in the same area on the same day</li>
              <li>Adjust zones seasonally based on demand patterns</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              2. Time Window Management
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Customer appointment windows significantly impact routing efficiency:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Narrow windows</strong> (2-hour): Higher customer satisfaction, harder to optimize</li>
              <li><strong>Wide windows</strong> (4-hour): Easier to optimize, less convenient for customers</li>
              <li><strong>First/last of day:</strong> Premium slots customers pay for, anchor your routes</li>
            </ul>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 my-8">
              <p className="text-blue-800 font-semibold mb-2">Pro Tip</p>
              <p className="text-blue-700">
                Offer "flexible" appointment options at a discount. Customers who don't need a specific time help you optimize routes — reward them for the flexibility.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              3. Job Sequencing
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              The order of jobs matters as much as their locations:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Start close to home:</strong> First job should be near where the tech starts</li>
              <li><strong>End close to home:</strong> Last job near home or shop reduces unpaid drive time</li>
              <li><strong>Consider job duration:</strong> Schedule longer jobs mid-day, shorter jobs at ends</li>
              <li><strong>Account for break times:</strong> Lunch near convenient food options</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              4. Traffic Pattern Awareness
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Smart routing systems account for predictable traffic patterns:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Avoid downtown/highway during rush hours</li>
              <li>Schedule distant jobs during low-traffic times</li>
              <li>Account for school zones and their timing</li>
              <li>Plan around known construction or events</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Manual vs. Automated Route Optimization
            </h2>

            <div className="grid md:grid-cols-2 gap-6 my-6">
              <div className="bg-gray-50 rounded-lg p-5">
                <p className="font-bold text-gray-900 mb-3">Manual Routing</p>
                <p className="text-sm text-gray-600 mb-3">Dispatcher plots routes by hand</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>Time-consuming (30-60 min/day)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>Relies on dispatcher knowledge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>Can't account for real-time traffic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>Hard to re-optimize on the fly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>No additional software cost</span>
                  </li>
                </ul>
              </div>
              <div className="bg-primary-50 rounded-lg p-5 border-2 border-primary-200">
                <p className="font-bold text-primary-900 mb-3">Automated Routing</p>
                <p className="text-sm text-primary-700 mb-3">Software optimizes automatically</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Instant optimization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Considers all variables</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Real-time traffic integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Re-optimizes when schedule changes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Typically pays for itself in savings</span>
                  </li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Implementing Route Optimization: Step by Step
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Step 1: Analyze Your Current State
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Before optimizing, understand where you are:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>How many miles does each tech drive per day?</li>
              <li>How much time between jobs is spent driving?</li>
              <li>What's your average jobs-per-tech-per-day?</li>
              <li>Where are your customers concentrated?</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Step 2: Define Your Service Zones
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Create logical geographic zones:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Group nearby zip codes or neighborhoods</li>
              <li>Consider natural barriers (rivers, highways)</li>
              <li>Balance zone sizes by customer density</li>
              <li>Assign primary and backup techs to each zone</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Step 3: Optimize Your Scheduling Process
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Book appointments with zone in mind first</li>
              <li>Offer time flexibility incentives</li>
              <li>Batch similar job types when possible</li>
              <li>Leave buffer time for emergencies</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              Step 4: Use Technology
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Modern FSM software handles route optimization automatically:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Drag-and-drop scheduling with map view</li>
              <li>Automatic route suggestions</li>
              <li>Real-time GPS tracking</li>
              <li>Traffic-aware ETAs</li>
              <li>One-click re-optimization</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Handling Schedule Disruptions
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Perfect routes don't survive contact with reality. Here's how to handle common disruptions:
            </p>

            <div className="space-y-4 my-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">Emergency Calls</p>
                <p className="text-gray-600 text-sm mt-1">Find the nearest available tech, re-optimize remaining jobs for other techs. Some software does this automatically.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">Job Runs Long</p>
                <p className="text-gray-600 text-sm mt-1">Update ETA for remaining customers immediately. Shift jobs to other techs if necessary. Communicate proactively.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">Customer Cancellation</p>
                <p className="text-gray-600 text-sm mt-1">Opportunity! Fill the slot with a nearby demand call or move up remaining jobs to finish earlier.</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">Traffic Accident</p>
                <p className="text-gray-600 text-sm mt-1">Real-time traffic integration re-routes automatically. Manual notification to affected customers.</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Measuring Route Optimization Success
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Track these KPIs to measure improvement:
            </p>
            <div className="bg-gray-50 rounded-xl p-6 my-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Efficiency Metrics</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Miles driven per job</li>
                    <li>• Drive time between jobs</li>
                    <li>• Jobs completed per tech per day</li>
                    <li>• Fuel cost per job</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Customer Metrics</p>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• On-time arrival rate</li>
                    <li>• Appointment window accuracy</li>
                    <li>• Customer satisfaction scores</li>
                    <li>• Same-day service availability</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The Bottom Line
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Route optimization isn't just about saving gas money — though that adds up. It's about:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>More revenue:</strong> More jobs per day = more income</li>
              <li><strong>Lower costs:</strong> Less fuel, less vehicle wear</li>
              <li><strong>Happier customers:</strong> On-time arrivals, shorter windows</li>
              <li><strong>Happier technicians:</strong> Less time in traffic, more time home</li>
              <li><strong>Competitive advantage:</strong> Faster response times than competitors</li>
            </ul>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 my-10">
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                Smart Routing Built In
              </h3>
              <p className="text-primary-800 mb-4">
                ServiceCrew AI includes intelligent route optimization that automatically suggests the most efficient job order, accounts for traffic, and re-optimizes when schedules change. See how much time and money you could save.
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
