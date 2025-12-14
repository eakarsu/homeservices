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
                December 6, 2025
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                7 min read
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              The Hidden Costs of Field Service Software Nobody Talks About
            </h1>
            <p className="text-xl text-gray-600">
              That $99/month software might actually cost you $500/month. Here's what vendors don't tell you upfront.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              When shopping for field service management software, the advertised price is rarely what you'll actually pay. Hidden fees, add-ons, and fine print can multiply your costs 3-5x. Here's a complete breakdown of the costs nobody talks about.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              1. Per-User or Per-Technician Fees
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Many platforms advertise a low base price but charge $25-500 per user per month on top. This is the biggest hidden cost in the industry.
            </p>
            <div className="bg-gray-50 rounded-xl p-6 my-6">
              <p className="font-semibold text-gray-900 mb-3">Example Calculation:</p>
              <ul className="space-y-2 text-gray-700">
                <li>• Advertised price: $99/month base</li>
                <li>• Per-technician fee: $50/user</li>
                <li>• Your team: 8 technicians + 2 office staff = 10 users</li>
                <li>• Actual cost: $99 + ($50 × 10) = <strong>$599/month</strong></li>
              </ul>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              That "affordable" $99/month software actually costs $7,188/year. Always ask: "What's the total cost for X users with all features included?"
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              2. Implementation and Setup Fees
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Enterprise software vendors often charge substantial upfront fees for setup, data migration, and configuration:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Basic setup:</strong> $500-2,000</li>
              <li><strong>Data migration:</strong> $1,000-5,000</li>
              <li><strong>Custom configuration:</strong> $2,000-10,000</li>
              <li><strong>Enterprise implementation:</strong> $10,000-50,000+</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-6">
              Some vendors bundle these into the first year's contract, making it difficult to compare true monthly costs.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              3. Training Costs
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Complex software requires extensive training. Costs include:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Vendor training sessions:</strong> $500-2,000</li>
              <li><strong>Your employees' time:</strong> Often 20-40 hours per person</li>
              <li><strong>Productivity loss:</strong> 2-4 weeks of reduced efficiency</li>
              <li><strong>Ongoing training for new hires:</strong> Recurring cost</li>
            </ul>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 my-8">
              <p className="text-amber-800 font-semibold mb-2">The Real Cost of Training</p>
              <p className="text-amber-700">
                If your 10 employees spend 30 hours each in training at an average loaded cost of $40/hour, that's $12,000 in lost productivity — just for initial training.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              4. Payment Processing Fees
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Most field service software integrates with payment processing. Watch out for:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Processing fees:</strong> 2.5-3.5% per transaction</li>
              <li><strong>Monthly gateway fees:</strong> $10-50/month</li>
              <li><strong>Markup over standard rates:</strong> Some vendors add 0.5-1% on top of processor fees</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-6">
              For a contractor doing $50,000/month in credit card payments, even a 0.5% markup costs an extra $250/month — $3,000/year.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              5. Add-On Feature Costs
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Many "essential" features are actually premium add-ons:
            </p>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">Common Add-Ons</p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• GPS tracking: $10-25/user/month</li>
                  <li>• Inventory management: $50-100/month</li>
                  <li>• Advanced reporting: $50-200/month</li>
                  <li>• Marketing tools: $100-300/month</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">Premium Features</p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• AI dispatch: $100-500/month</li>
                  <li>• Service agreements: $50-100/month</li>
                  <li>• QuickBooks integration: $25-50/month</li>
                  <li>• API access: $100-500/month</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              6. SMS and Communication Fees
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Automated customer notifications seem free until you see the bill:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>SMS messages:</strong> $0.01-0.05 per message</li>
              <li><strong>Monthly SMS bundle limits:</strong> Overage charges apply</li>
              <li><strong>Phone call notifications:</strong> $0.03-0.10 per minute</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-6">
              A busy shop sending 2,000 SMS notifications/month at $0.03 each spends an extra $60/month — not included in the base price.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              7. Storage and Data Fees
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Photos, documents, and data add up. Many platforms charge for:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Photo storage:</strong> Limits or overage fees</li>
              <li><strong>Document storage:</strong> $10-50/month for additional storage</li>
              <li><strong>Data export:</strong> Some charge to export your own data</li>
              <li><strong>Backup and recovery:</strong> Often a premium feature</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              8. Contract Lock-In Penalties
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Long-term contracts come with hidden risks:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Annual price increases:</strong> 5-15% yearly increases are common</li>
              <li><strong>Early termination fees:</strong> Often 50-100% of remaining contract value</li>
              <li><strong>Auto-renewal clauses:</strong> Contracts renew unless cancelled 30-90 days in advance</li>
              <li><strong>Price lock expiration:</strong> Promotional rates expire after year one</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              9. Support Costs
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Not all support is created equal:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Basic support:</strong> Email only, 24-48 hour response</li>
              <li><strong>Priority support:</strong> $50-200/month extra</li>
              <li><strong>Phone support:</strong> Often premium only</li>
              <li><strong>Dedicated account manager:</strong> Enterprise tier requirement</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              How to Calculate Your True Cost
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Before signing up for any field service software, calculate the total cost of ownership:
            </p>
            <div className="bg-gray-50 rounded-xl p-6 my-6">
              <p className="font-semibold text-gray-900 mb-3">Total Cost Checklist:</p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Base monthly fee × 12 months</li>
                <li>Per-user fees × number of users × 12 months</li>
                <li>One-time setup/implementation fees</li>
                <li>Training costs (vendor + employee time)</li>
                <li>Add-on features you'll actually need</li>
                <li>Estimated payment processing fees</li>
                <li>SMS/communication overages</li>
                <li>Storage fees if applicable</li>
              </ol>
              <p className="mt-4 font-semibold text-gray-900">= True Annual Cost</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The Transparent Alternative
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              The best field service software companies are moving toward transparent, all-inclusive pricing:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>✓ Flat monthly fee (no per-user charges)</li>
              <li>✓ All features included at every tier</li>
              <li>✓ No setup or implementation fees</li>
              <li>✓ No long-term contracts</li>
              <li>✓ Free training and support</li>
              <li>✓ Standard payment processing rates</li>
            </ul>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 my-10">
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                No Hidden Costs. Ever.
              </h3>
              <p className="text-primary-800 mb-4">
                ServiceCrew AI offers simple, transparent pricing. $99/month for up to 10 users includes ALL features — AI dispatch, scheduling, invoicing, mobile app, inventory, reports, and more. No setup fees. No contracts. No surprises.
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
