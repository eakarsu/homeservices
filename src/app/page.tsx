'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  WrenchScrewdriverIcon,
  BoltIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (status === 'authenticated') {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <PublicHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <SparklesIcon className="h-4 w-4" />
              AI-Powered Field Service Management
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
              ServiceTitan Features.
              <span className="text-primary-600"> 1/10th the Price.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The modern field service platform for HVAC, plumbing, and electrical contractors.
              AI-powered dispatch, scheduling, invoicing — all for a flat monthly fee.
              No per-technician charges. No contracts.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
                Start Free 14-Day Trial
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium text-lg flex items-center gap-2">
                Sign in to your account
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">No credit card required. Cancel anytime.</p>
          </div>

          {/* Hero Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">$0</div>
              <div className="text-gray-600">Free plan forever</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">$0</div>
              <div className="text-gray-600">Setup fees</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">$0</div>
              <div className="text-gray-600">Per-tech charges</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">0</div>
              <div className="text-gray-600">Contracts</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tired of Overpaying for Field Service Software?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Most contractors pay $250-500 per technician per month. A 10-tech shop spends
              $30,000-60,000/year just on software. That's insane.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-red-500 text-2xl font-bold mb-2">$500/tech/month</div>
              <div className="text-gray-600">Average cost with ServiceTitan</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-red-500 text-2xl font-bold mb-2">12-24 months</div>
              <div className="text-gray-600">Locked into contracts</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-red-500 text-2xl font-bold mb-2">$5,000-50,000</div>
              <div className="text-gray-600">Setup and onboarding fees</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need. Nothing You Don't.
            </h2>
            <p className="text-xl text-gray-600">
              Built specifically for HVAC, plumbing, and electrical contractors.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: SparklesIcon,
                title: 'AI-Powered Dispatch',
                description: 'Automatically assigns the right technician based on skills, location, and availability.',
              },
              {
                icon: ClockIcon,
                title: 'Smart Scheduling',
                description: 'Drag-and-drop calendar with intelligent route optimization to minimize drive time.',
              },
              {
                icon: CurrencyDollarIcon,
                title: 'Estimates & Invoicing',
                description: 'Good/Better/Best pricing, digital signatures, and instant payment processing.',
              },
              {
                icon: DevicePhoneMobileIcon,
                title: 'Mobile App for Techs',
                description: 'Everything technicians need in the field — jobs, photos, signatures, payments.',
              },
              {
                icon: ChartBarIcon,
                title: 'Real-Time Dashboard',
                description: 'Track jobs, revenue, and technician status in real-time from anywhere.',
              },
              {
                icon: BoltIcon,
                title: 'AI Diagnostics',
                description: 'AI assistant helps technicians diagnose issues and recommend solutions.',
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              No hidden fees. No per-technician charges. No surprises.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
              Save $15,000+ per year compared to ServiceTitan
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="text-lg font-semibold text-gray-900 mb-2">Free</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">$0<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <p className="text-gray-500 text-sm mb-4">Forever free</p>
              <p className="text-gray-600 mb-6">Perfect for solo technicians just getting started</p>
              <ul className="space-y-3 mb-8">
                {['1 user', '25 jobs/month', 'Basic scheduling', 'Invoicing', 'Mobile app', 'Customer management'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-600 text-sm">
                    <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center btn-secondary py-3">
                Start Free
              </Link>
            </div>

            {/* Starter Tier */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="text-lg font-semibold text-gray-900 mb-2">Starter</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">$49<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <p className="text-gray-500 text-sm mb-4">Billed monthly</p>
              <p className="text-gray-600 mb-6">For small teams ready to grow</p>
              <ul className="space-y-3 mb-8">
                {['Up to 3 users', 'Unlimited jobs', 'Smart scheduling', 'Estimates & invoicing', 'GPS tracking', 'Email notifications', 'Basic reporting'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-600 text-sm">
                    <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center btn-secondary py-3">
                Start Free Trial
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="bg-white p-6 rounded-xl border-2 border-primary-500 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-2">Pro</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">$99<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <p className="text-gray-500 text-sm mb-4">Billed monthly</p>
              <p className="text-gray-600 mb-6">For growing teams up to 10 users</p>
              <ul className="space-y-3 mb-8">
                {['Up to 10 users', 'Everything in Starter', 'AI-powered dispatch', 'AI diagnostics', 'Inventory management', 'Service agreements', 'SMS notifications', 'Priority support'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-600 text-sm">
                    <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center btn-primary py-3">
                Start Free Trial
              </Link>
            </div>

            {/* Business Tier */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="text-lg font-semibold text-gray-900 mb-2">Business</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">$199<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <p className="text-gray-500 text-sm mb-4">Billed monthly</p>
              <p className="text-gray-600 mb-6">Unlimited users, unlimited power</p>
              <ul className="space-y-3 mb-8">
                {['Unlimited users', 'Everything in Pro', 'Multi-location support', 'Advanced analytics', 'API access', 'Custom integrations', 'Dedicated account manager', 'White-label options'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-600 text-sm">
                    <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full text-center btn-secondary py-3">
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Pricing Comparison Callout */}
          <div className="mt-12 bg-white rounded-xl p-8 max-w-4xl mx-auto border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Why ServiceCrew AI vs ServiceTitan?</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-red-500 mb-1">$250-500</div>
                <div className="text-gray-600 text-sm">ServiceTitan per tech/month</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-1">$99 flat</div>
                <div className="text-gray-600 text-sm">ServiceCrew AI for 10 users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-500 mb-1">90%+</div>
                <div className="text-gray-600 text-sm">Your savings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              See How We Compare
            </h2>
            <p className="text-xl text-gray-600">
              Why pay more for the same features?
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 text-gray-600 font-medium"></th>
                  <th className="text-center py-4 px-4">
                    <div className="text-primary-600 font-bold">ServiceCrew AI</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="text-gray-600 font-medium">ServiceTitan</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="text-gray-600 font-medium">Housecall Pro</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Starting Price', us: '$0/mo', them1: '$245+/mo', them2: '$49/mo' },
                  { feature: 'Per-Technician Fee', us: 'None', them1: '$245-500/tech', them2: 'Yes' },
                  { feature: 'Contract Required', us: 'No', them1: '12+ months', them2: 'No' },
                  { feature: 'Setup Fee', us: '$0', them1: '$5,000-50,000', them2: '$0' },
                  { feature: 'Free Plan', us: true, them1: false, them2: false },
                  { feature: 'AI Dispatch', us: true, them1: 'Add-on', them2: false },
                  { feature: 'AI Diagnostics', us: true, them1: false, them2: false },
                  { feature: 'AI Quote Generator', us: true, them1: false, them2: false },
                  { feature: 'Mobile App', us: true, them1: true, them2: true },
                  { feature: 'Inventory Management', us: true, them1: true, them2: 'Limited' },
                  { feature: '10 Users Cost', us: '$99/mo', them1: '$2,500+/mo', them2: '$490/mo' },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-900 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.us === 'boolean' ? (
                        row.us ? <CheckIcon className="h-6 w-6 text-green-500 mx-auto" /> : <XMarkIcon className="h-6 w-6 text-red-500 mx-auto" />
                      ) : (
                        <span className="text-primary-600 font-semibold">{row.us}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600">
                      {typeof row.them1 === 'boolean' ? (
                        row.them1 ? <CheckIcon className="h-6 w-6 text-green-500 mx-auto" /> : <XMarkIcon className="h-6 w-6 text-red-500 mx-auto" />
                      ) : (
                        row.them1
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600">
                      {typeof row.them2 === 'boolean' ? (
                        row.them2 ? <CheckIcon className="h-6 w-6 text-green-500 mx-auto" /> : <XMarkIcon className="h-6 w-6 text-red-500 mx-auto" />
                      ) : (
                        row.them2
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Stop Overpaying?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join contractors saving thousands every month. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center gap-2">
              Start Free 14-Day Trial
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link href="/login" className="text-white hover:text-primary-100 font-medium text-lg">
              or sign in to your account
            </Link>
          </div>
          <p className="text-primary-200 text-sm mt-4">No credit card required. No contracts. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>
  )
}
