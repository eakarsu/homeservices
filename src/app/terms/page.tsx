'use client'

import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <PublicHeader />

      {/* Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: December 6, 2025</p>

          <div className="prose prose-lg max-w-none text-gray-600">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing or using ServiceCrew AI's field service management platform ("Service"),
                you agree to be bound by these Terms of Service ("Terms"). If you disagree with any
                part of the terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p>
                ServiceCrew AI provides a cloud-based field service management platform that includes
                scheduling, dispatch, invoicing, customer management, and AI-powered features for
                home service businesses. The Service is provided "as is" and "as available."
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="mb-4">When you create an account with us, you must:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Provide accurate, complete, and current information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>
              <p className="mt-4">
                We reserve the right to refuse service, terminate accounts, or remove content at our
                sole discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Subscription and Payment</h2>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Billing</h3>
              <p className="mb-4">
                Paid subscriptions are billed in advance on a monthly basis. You agree to pay all
                fees associated with your subscription plan.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-2">Free Trial</h3>
              <p className="mb-4">
                We may offer a free trial period. At the end of the trial, your account will
                automatically convert to a paid subscription unless you cancel before the trial ends.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-2">Refunds</h3>
              <p>
                Subscription fees are non-refundable except as required by law. You may cancel your
                subscription at any time, and you will continue to have access until the end of your
                current billing period.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use</h2>
              <p className="mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights of others</li>
                <li>Transmit harmful code, viruses, or malware</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Send spam or unsolicited communications</li>
                <li>Collect user information without consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="mb-4">
                The Service and its original content, features, and functionality are owned by
                ServiceCrew AI and are protected by international copyright, trademark, patent,
                trade secret, and other intellectual property laws.
              </p>
              <p>
                You retain ownership of any data you submit to the Service. By using the Service,
                you grant us a license to use, store, and process your data solely for the purpose
                of providing the Service to you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data and Privacy</h2>
              <p>
                Your use of the Service is also governed by our Privacy Policy, which is incorporated
                into these Terms by reference. Please review our Privacy Policy to understand our
                practices regarding your personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Third-Party Services</h2>
              <p>
                The Service may integrate with third-party services (payment processors, mapping
                services, etc.). Your use of such third-party services is subject to their respective
                terms and privacy policies. We are not responsible for the content or practices of
                any third-party services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimer of Warranties</h2>
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
                EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT
                WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SERVICECREW AI SHALL NOT BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
                PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA,
                USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
              </p>
              <p className="mt-4">
                OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR THE
                SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless ServiceCrew AI and its officers,
                directors, employees, and agents from any claims, damages, losses, liabilities, and
                expenses (including legal fees) arising out of your use of the Service or violation
                of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately,
                without prior notice or liability, for any reason, including if you breach these
                Terms. Upon termination, your right to use the Service will immediately cease.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision
                is material, we will provide at least 30 days notice prior to any new terms taking
                effect. What constitutes a material change will be determined at our sole discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the
                State of California, without regard to its conflict of law provisions. Any disputes
                arising under these Terms shall be subject to the exclusive jurisdiction of the
                courts located in San Francisco County, California.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <ul className="list-none mt-4 space-y-1">
                <li>Email: legal@servicecrewai.com</li>
                <li>Address: 2807 Hampton Woods Dr, Richmond, VA 23233</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  )
}
