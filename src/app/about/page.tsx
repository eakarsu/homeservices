'use client'

import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <PublicHeader />

      {/* Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">About ServiceCrew AI</h1>

          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600 mb-4">
                ServiceCrew AI was founded with a simple mission: to give small and medium-sized home service
                businesses access to the same powerful software tools that large enterprises use, without
                the enterprise price tag.
              </p>
              <p className="text-gray-600">
                We believe that every HVAC technician, plumber, and electrician deserves software that
                helps them grow their business, not drain their profits.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">The Problem We Solve</h2>
              <p className="text-gray-600 mb-4">
                The field service management software market has been dominated by expensive enterprise
                solutions that charge $250-500 per technician per month, plus thousands in setup fees
                and long-term contracts.
              </p>
              <p className="text-gray-600">
                For a 10-person team, that's $30,000-60,000 per year just for software. Many small
                businesses simply can't afford these tools, leaving them stuck with spreadsheets,
                paper forms, and inefficient processes.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Solution</h2>
              <p className="text-gray-600 mb-4">
                ServiceCrew AI offers a complete field service management platform with AI-powered
                features at a fraction of the cost:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Free plan for solo technicians</li>
                <li>Flat monthly pricing - no per-technician fees</li>
                <li>No setup fees or long-term contracts</li>
                <li>AI-powered dispatch, diagnostics, and scheduling</li>
                <li>Mobile app for technicians in the field</li>
                <li>Invoicing, estimates, and payment processing</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Who We Serve</h2>
              <p className="text-gray-600 mb-4">
                ServiceCrew AI is built specifically for home service businesses:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>HVAC contractors</li>
                <li>Plumbing companies</li>
                <li>Electrical contractors</li>
                <li>Appliance repair services</li>
                <li>Cleaning services</li>
                <li>Landscaping companies</li>
                <li>Pest control services</li>
                <li>General home repair and maintenance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600">
                Have questions? We'd love to hear from you. Reach out at{' '}
                <a href="mailto:hello@servicecrewai.com" className="text-primary-600 hover:text-primary-500">
                  hello@servicecrewai.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  )
}
