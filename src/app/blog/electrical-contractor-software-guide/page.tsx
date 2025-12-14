'use client'

import Link from 'next/link'
import { ArrowLeftIcon, CalendarIcon, ClockIcon, BoltIcon } from '@heroicons/react/24/outline'
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
                Electrical
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                November 28, 2025
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                10 min read
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Electrical Contractor Software: From Dispatch to Invoice
            </h1>
            <p className="text-xl text-gray-600">
              A complete guide to field service software for electrical contractors — covering service calls, panel upgrades, EV charger installations, and everything in between.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              Electrical contracting is evolving rapidly. From traditional service calls to EV charger installations and solar integrations, modern electrical contractors need software that keeps up with the changing industry while handling core operations efficiently.
            </p>

            <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 my-8">
              <BoltIcon className="h-8 w-8 text-yellow-600 flex-shrink-0" />
              <p className="text-yellow-800 font-medium">
                The electrical industry is growing faster than HVAC or plumbing, driven by EV adoption, solar installations, and aging infrastructure. The right software helps you capture this growth.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              What Makes Electrical Different
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Electrical contractors face unique challenges:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Licensing requirements:</strong> Journeyman vs. Master Electrician for different work</li>
              <li><strong>Permit-heavy work:</strong> Most electrical work requires permits and inspections</li>
              <li><strong>Safety-critical:</strong> Proper documentation and testing is essential</li>
              <li><strong>Project diversity:</strong> From changing outlets to commercial buildouts</li>
              <li><strong>Growing services:</strong> EV chargers, solar, smart home, generators</li>
              <li><strong>Code compliance:</strong> NEC updates and local code variations</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Essential Features for Electrical Contractors
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              1. License & Certification Tracking
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Electrical work is heavily regulated. Your software should:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Track certifications:</strong> Journeyman, Master, specialty certifications</li>
              <li><strong>Expiration alerts:</strong> Notify when licenses need renewal</li>
              <li><strong>Skill-based dispatch:</strong> Only assign qualified techs to jobs</li>
              <li><strong>Compliance documentation:</strong> Keep records for inspections</li>
            </ul>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
              <p className="font-semibold text-blue-900 mb-2">Compliance Matters</p>
              <p className="text-blue-800">
                Sending an unqualified tech to a job that requires a Master Electrician can result in permit denials, failed inspections, and liability issues. Your software should prevent this automatically.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              2. Permit Management
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Most electrical work requires permits. Track:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Permit status:</strong> Applied, approved, pending inspection</li>
              <li><strong>Inspection scheduling:</strong> Coordinate with inspectors</li>
              <li><strong>Documentation:</strong> Store permits with job records</li>
              <li><strong>Jurisdiction requirements:</strong> Different rules for different areas</li>
              <li><strong>Permit costs:</strong> Include in estimates accurately</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              3. Service Type Management
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Electrical work spans a wide range of services:
            </p>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">Residential Service</p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• Outlet/switch repairs</li>
                  <li>• Ceiling fan installation</li>
                  <li>• Panel upgrades</li>
                  <li>• Troubleshooting/diagnostics</li>
                  <li>• Lighting installation</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">Growing Services</p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• EV charger installation</li>
                  <li>• Solar integration</li>
                  <li>• Generator installation</li>
                  <li>• Smart home systems</li>
                  <li>• Whole-house surge protection</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">Commercial Service</p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• Tenant improvements</li>
                  <li>• Emergency repairs</li>
                  <li>• Preventive maintenance</li>
                  <li>• Lighting retrofits</li>
                  <li>• Data/low voltage</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">Large Projects</p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• New construction</li>
                  <li>• Whole-house rewiring</li>
                  <li>• Service upgrades</li>
                  <li>• Commercial buildouts</li>
                  <li>• Industrial installations</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              4. Photo Documentation & Testing Records
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Documentation is critical for electrical work:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Before/after photos:</strong> Show work completed</li>
              <li><strong>Panel photos:</strong> Document breaker configurations</li>
              <li><strong>Test results:</strong> Record voltage, amperage, resistance readings</li>
              <li><strong>Code compliance photos:</strong> Evidence for inspections</li>
              <li><strong>Problem documentation:</strong> Safety hazards found during service</li>
            </ul>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 my-8">
              <p className="text-amber-800 font-semibold mb-2">Liability Protection</p>
              <p className="text-amber-700">
                Thorough photo documentation protects you. If a customer claims your work caused a problem, documented photos and test records are your best defense.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              5. Flexible Estimating
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Electrical estimates need flexibility for:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Time & materials:</strong> For diagnostic and troubleshooting work</li>
              <li><strong>Flat-rate:</strong> For standard installations and repairs</li>
              <li><strong>Project-based:</strong> For larger installations</li>
              <li><strong>Good/Better/Best:</strong> Upgrade options (standard vs. smart devices)</li>
              <li><strong>Permit costs:</strong> Include as separate line items</li>
              <li><strong>Material allowances:</strong> For unknown conditions</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              6. Inventory Management
            </h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Electrical contractors carry specialized inventory:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Wire and cable:</strong> Different gauges, types (Romex, MC, THHN)</li>
              <li><strong>Breakers:</strong> Multiple brands, amperages, types</li>
              <li><strong>Devices:</strong> Outlets, switches, GFCIs, AFCIs</li>
              <li><strong>Fixtures:</strong> Ceiling fans, light fixtures</li>
              <li><strong>Specialty items:</strong> EV charger components, smart devices</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
              7. Multi-Day Project Support
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Many electrical jobs span multiple days. Your software should handle:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Job continuity:</strong> Track progress across multiple visits</li>
              <li><strong>Team assignments:</strong> Multiple techs on the same project</li>
              <li><strong>Phase tracking:</strong> Rough-in, trim, final</li>
              <li><strong>Inspection coordination:</strong> Schedule around inspections</li>
              <li><strong>Progress billing:</strong> Invoice in stages for larger projects</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The EV Charger Opportunity
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              EV charger installation is one of the fastest-growing segments for electrical contractors. Your software should support this workflow:
            </p>

            <div className="bg-green-50 rounded-xl p-6 my-6">
              <p className="font-semibold text-green-900 mb-3">EV Charger Installation Workflow</p>
              <ol className="list-decimal pl-6 space-y-2 text-green-800">
                <li>Customer inquiry — capture vehicle type, desired charger, electrical panel info</li>
                <li>Site assessment — document panel capacity, circuit availability, distance to install location</li>
                <li>Present options — Level 2 charger brands, installation approaches</li>
                <li>Handle permit application</li>
                <li>Schedule installation (often panel upgrade + charger install)</li>
                <li>Complete installation with photos</li>
                <li>Coordinate inspection</li>
                <li>Customer training on charger use</li>
                <li>Register warranty and provide documentation</li>
              </ol>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Maintenance Agreement Opportunities
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              While less common than HVAC agreements, electrical maintenance programs work for:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Commercial accounts:</strong> Preventive maintenance contracts</li>
              <li><strong>Generator customers:</strong> Annual testing and maintenance</li>
              <li><strong>Panel inspection programs:</strong> Annual safety checks</li>
              <li><strong>Smart home support:</strong> Ongoing support contracts</li>
              <li><strong>Priority service:</strong> Emergency response priority</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              What Electrical Contractors Should Pay
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Pricing expectations for electrical contractor software:
            </p>

            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Company Size</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Reasonable Cost</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Features Needed</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">1-2 electricians</td>
                    <td className="border border-gray-200 px-4 py-2">$0-75/mo</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">Scheduling, invoicing, mobile app</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">3-8 electricians</td>
                    <td className="border border-gray-200 px-4 py-2">$75-175/mo</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">+ Dispatch board, inventory, reporting</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">9-20 electricians</td>
                    <td className="border border-gray-200 px-4 py-2">$150-300/mo</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">+ Project management, certifications</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">20+ electricians</td>
                    <td className="border border-gray-200 px-4 py-2">$250-500/mo</td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">+ Multi-location, API access</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Features to Skip
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Don't pay for features designed for other trades:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li><strong>Seasonal tune-up scheduling:</strong> More relevant for HVAC</li>
              <li><strong>Equipment age tracking:</strong> Electrical doesn't have "equipment" like HVAC</li>
              <li><strong>Refrigerant tracking:</strong> HVAC-specific requirement</li>
              <li><strong>Complex route optimization:</strong> Less critical for electrical (jobs often take longer)</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              Implementation Tips for Electrical Contractors
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Setting Up Your Pricebook
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Organize by service type (troubleshooting, installations, upgrades)</li>
              <li>Include permit costs as separate line items</li>
              <li>Create Good/Better/Best options for common upgrades</li>
              <li>Build in material allowances for unknown conditions</li>
              <li>Set up T&M rates for diagnostic work</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Training Your Team
            </h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
              <li>Focus on photo documentation requirements</li>
              <li>Practice creating estimates on the mobile app</li>
              <li>Train on capturing test readings and results</li>
              <li>Establish permit tracking procedures</li>
              <li>Create templates for common job types</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
              The Bottom Line
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Electrical contractors need software that handles the unique aspects of the trade — permit tracking, certification management, diverse service types, and thorough documentation. The industry is growing with EV chargers, solar, and smart home work, so choose software that grows with you.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Look for flat-rate pricing without per-electrician fees, and make sure the mobile app makes photo documentation and estimating fast and easy in the field.
            </p>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-8 my-10">
              <h3 className="text-xl font-bold text-primary-900 mb-3">
                Ready for the Electrical Industry's Growth
              </h3>
              <p className="text-primary-800 mb-4">
                ServiceCrew AI handles the full range of electrical work — from service calls to EV charger installations to commercial projects. Flat-rate pricing, powerful mobile app, and all the documentation tools you need.
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
