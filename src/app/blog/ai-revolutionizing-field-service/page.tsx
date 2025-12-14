'use client'

import Link from 'next/link'
import { ArrowLeftIcon, CalendarIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline'
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
                Industry Trends
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                December 3, 2025
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                8 min read
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              5 Ways AI is Revolutionizing Field Service Management
            </h1>
            <p className="text-xl text-gray-600">
              Artificial intelligence isn't just a buzzword — it's transforming how contractors dispatch, diagnose, price, and run their businesses.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              The field service industry is experiencing an AI revolution. What was once available only to enterprise companies with massive budgets is now accessible to contractors of all sizes. Here are five ways AI is changing the game.
            </p>

            <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl p-4 my-8">
              <SparklesIcon className="h-8 w-8 text-purple-600 flex-shrink-0" />
              <p className="text-purple-800 font-medium">
                AI in field service isn't about replacing humans — it's about making your team more efficient and effective.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              1. AI-Powered Smart Dispatch
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Traditional dispatch relies on a dispatcher's memory and intuition: Who's closest? Who can handle this type of job? Who's available? AI transforms this into a data-driven decision.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              How AI Dispatch Works
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              AI dispatch systems analyze multiple factors simultaneously:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Location:</strong> Real-time GPS positions of all technicians</li>
              <li><strong>Skills:</strong> Certifications and experience for the specific job type</li>
              <li><strong>Availability:</strong> Current job status and estimated completion time</li>
              <li><strong>Traffic:</strong> Real-time traffic conditions affecting travel time</li>
              <li><strong>Customer history:</strong> Has this tech worked with this customer before?</li>
              <li><strong>Efficiency:</strong> Historical data on how fast each tech completes similar jobs</li>
            </ul>

            <div className="bg-gray-50 rounded-xl p-6 my-6">
              <p className="font-semibold text-gray-900 mb-3">Real-World Impact</p>
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary-600">23%</p>
                  <p className="text-gray-600 text-sm">Reduction in drive time</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary-600">15%</p>
                  <p className="text-gray-600 text-sm">More jobs per day</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary-600">4+ hrs</p>
                  <p className="text-gray-600 text-sm">Dispatcher time saved weekly</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              2. AI Diagnostic Assistance
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Even experienced technicians occasionally encounter unfamiliar equipment or unusual problems. AI diagnostic tools act as a knowledgeable assistant in the field.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              How AI Diagnostics Help
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Symptom analysis:</strong> Tech describes the problem; AI suggests likely causes</li>
              <li><strong>Equipment-specific guidance:</strong> Pull up known issues for specific models</li>
              <li><strong>Repair procedures:</strong> Step-by-step guidance for complex repairs</li>
              <li><strong>Parts identification:</strong> Identify needed parts from photos or descriptions</li>
              <li><strong>Code lookup:</strong> Instant error code interpretation</li>
            </ul>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 my-8">
              <p className="text-blue-800 font-semibold mb-2">Example in Action</p>
              <p className="text-blue-700">
                A technician encounters an unfamiliar error code on a Carrier furnace. They type the code into the AI assistant, which instantly provides: what the code means, common causes, diagnostic steps, and the most likely fix — along with the part number if a replacement is needed.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              3. Intelligent Pricing & Estimates
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Pricing is both art and science. AI helps contractors optimize their pricing for profitability while remaining competitive.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              AI Pricing Capabilities
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Quote generation:</strong> Generate accurate estimates based on job details</li>
              <li><strong>Good/Better/Best options:</strong> AI creates tiered options automatically</li>
              <li><strong>Dynamic pricing:</strong> Adjust for demand, urgency, or customer type</li>
              <li><strong>Margin optimization:</strong> Ensure profitability on every job</li>
              <li><strong>Competitive analysis:</strong> Stay competitive in your market</li>
            </ul>

            <div className="bg-gray-50 rounded-xl p-6 my-6">
              <p className="font-semibold text-gray-900 mb-3">How AI Quote Generation Works</p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Tech inputs job details (equipment, problem, needed repairs)</li>
                <li>AI pulls pricing from your pricebook</li>
                <li>System generates Good/Better/Best options</li>
                <li>Estimates account for labor time, parts, and desired margin</li>
                <li>Tech presents professional options to customer on the spot</li>
              </ol>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              4. Predictive Maintenance & Scheduling
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              AI can predict when equipment is likely to fail or need service, enabling proactive outreach to customers.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Predictive Capabilities
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Service reminders:</strong> Automatically schedule maintenance based on equipment age and usage</li>
              <li><strong>Failure prediction:</strong> Identify equipment likely to need replacement soon</li>
              <li><strong>Seasonal forecasting:</strong> Predict demand spikes and staff accordingly</li>
              <li><strong>Inventory planning:</strong> Know which parts you'll need before you run out</li>
              <li><strong>Customer outreach:</strong> Proactively contact customers before problems occur</li>
            </ul>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6 my-6">
              <p className="font-semibold text-green-900 mb-2">Revenue Opportunity</p>
              <p className="text-green-800">
                A 10-year-old furnace that hasn't been serviced in 2 years is a prime candidate for a tune-up call — and possibly a replacement conversation. AI identifies these opportunities automatically.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              5. Automated Customer Communication
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              AI handles routine customer communications, freeing your team to focus on higher-value activities.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              AI Communication Features
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Appointment confirmations:</strong> Automatic texts/emails with tech info and ETA</li>
              <li><strong>"On my way" notifications:</strong> Real-time updates as tech approaches</li>
              <li><strong>Follow-up messages:</strong> Thank you notes and review requests</li>
              <li><strong>Service reminders:</strong> Proactive maintenance notifications</li>
              <li><strong>Invoice reminders:</strong> Polite follow-ups on outstanding payments</li>
            </ul>

            <div className="bg-gray-50 rounded-xl p-6 my-6">
              <p className="font-semibold text-gray-900 mb-3">Customer Experience Improvement</p>
              <div className="space-y-2 text-gray-700">
                <p>• <strong>Before AI:</strong> Customer waits, calls office to ask "Where's the tech?"</p>
                <p>• <strong>After AI:</strong> Customer receives automatic updates: booking confirmed → tech assigned → on the way → arriving in 10 minutes</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Getting Started with AI in Your Business
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              You don't need to be a tech company to benefit from AI. Modern field service platforms include these features out of the box.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Start with High-Impact Features
            </h3>
            <ol className="list-decimal pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>AI dispatch:</strong> Immediate time savings and efficiency gains</li>
              <li><strong>Automated communications:</strong> Better customer experience with zero effort</li>
              <li><strong>Smart pricing:</strong> Improve margins on every job</li>
              <li><strong>Diagnostic assistance:</strong> Help less experienced techs perform better</li>
              <li><strong>Predictive scheduling:</strong> Generate more revenue from existing customers</li>
            </ol>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The Future is Already Here
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              AI in field service isn't coming — it's here. Contractors who adopt these tools now will have a significant competitive advantage. Those who wait risk falling behind as customer expectations rise and competitors become more efficient.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              The good news? AI-powered field service software is now affordable for businesses of all sizes. You don't need an enterprise budget to access enterprise-level technology.
            </p>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 my-10">
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                AI-Powered Field Service for Everyone
              </h3>
              <p className="text-primary-800 mb-4">
                ServiceCrew AI includes AI-powered dispatch, diagnostic assistance, smart pricing, and automated communications — all starting at $99/month. No enterprise budget required.
              </p>
              <Link href="/register" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                Try AI-Powered Field Service Free
              </Link>
            </div>
          </div>
        </article>
      </main>

      <PublicFooter />
    </div>
  )
}
