'use client'

import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: December 6, 2025</p>

          <div className="prose prose-lg max-w-none text-gray-600">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies</h2>
              <p>
                Cookies are small text files that are stored on your computer or mobile device when you
                visit a website. They are widely used to make websites work more efficiently and provide
                information to the owners of the site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Cookies</h2>
              <p className="mb-4">ServiceCrew AI uses cookies for the following purposes:</p>

              <h3 className="text-xl font-medium text-gray-900 mb-2">Essential Cookies</h3>
              <p className="mb-4">
                These cookies are necessary for the website to function properly. They enable core
                functionality such as security, network management, and account access. You cannot
                opt out of these cookies.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-2">Performance Cookies</h3>
              <p className="mb-4">
                These cookies help us understand how visitors interact with our website by collecting
                and reporting information anonymously. This helps us improve our website's performance.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-2">Functionality Cookies</h3>
              <p className="mb-4">
                These cookies enable enhanced functionality and personalization, such as remembering
                your preferences and settings.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-2">Marketing Cookies</h3>
              <p>
                These cookies are used to track visitors across websites to display relevant
                advertisements. They may be set by us or by third-party advertising partners.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Cookies We Use</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Cookie Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Purpose</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm">session_id</td>
                      <td className="px-4 py-3 text-sm">Authentication</td>
                      <td className="px-4 py-3 text-sm">Session</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">csrf_token</td>
                      <td className="px-4 py-3 text-sm">Security</td>
                      <td className="px-4 py-3 text-sm">Session</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">preferences</td>
                      <td className="px-4 py-3 text-sm">User preferences</td>
                      <td className="px-4 py-3 text-sm">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">_ga</td>
                      <td className="px-4 py-3 text-sm">Google Analytics</td>
                      <td className="px-4 py-3 text-sm">2 years</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">_gid</td>
                      <td className="px-4 py-3 text-sm">Google Analytics</td>
                      <td className="px-4 py-3 text-sm">24 hours</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Cookies</h2>
              <p>
                In addition to our own cookies, we may also use various third-party cookies to
                report usage statistics, deliver advertisements, and so on. These include:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-4">
                <li>Google Analytics (analytics)</li>
                <li>Stripe (payment processing)</li>
                <li>Intercom (customer support)</li>
                <li>HubSpot (marketing)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Managing Cookies</h2>
              <p className="mb-4">
                You can control and manage cookies in various ways. Please note that removing or
                blocking cookies may impact your user experience and some functionality may no
                longer be available.
              </p>
              <p className="mb-4">
                <strong>Browser Settings:</strong> Most browsers allow you to refuse to accept cookies
                and to delete cookies. The methods for doing so vary from browser to browser.
              </p>
              <p>
                <strong>Our Cookie Settings:</strong> You can adjust your cookie preferences by
                clicking the "Cookie Settings" link in the footer of our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time. We will notify you of any
                significant changes by posting the new policy on this page and updating the
                "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Contact Us</h2>
              <p>
                If you have questions about our use of cookies, please contact us at:
              </p>
              <ul className="list-none mt-4 space-y-1">
                <li>Email: privacy@servicecrewai.com</li>
                <li>Address: 2807 Hampton Woods Dr, Richmond, VA 23233</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
