'use client'

import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'

export default function GDPRPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">GDPR Compliance</h1>
          <p className="text-gray-500 mb-8">Last updated: December 6, 2025</p>

          <div className="prose prose-lg max-w-none text-gray-600">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Commitment to GDPR</h2>
              <p>
                ServiceCrew AI is committed to protecting the privacy and security of personal data
                in accordance with the General Data Protection Regulation (GDPR). This page outlines
                how we comply with GDPR requirements and your rights as a data subject.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights Under GDPR</h2>
              <p className="mb-4">
                If you are a resident of the European Economic Area (EEA), you have the following
                data protection rights:
              </p>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">Right to Access</h3>
                  <p className="text-sm">
                    You have the right to request copies of your personal data.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">Right to Rectification</h3>
                  <p className="text-sm">
                    You have the right to request that we correct any information you believe is inaccurate
                    or complete information you believe is incomplete.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">Right to Erasure</h3>
                  <p className="text-sm">
                    You have the right to request that we erase your personal data, under certain conditions.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">Right to Restrict Processing</h3>
                  <p className="text-sm">
                    You have the right to request that we restrict the processing of your personal data,
                    under certain conditions.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">Right to Data Portability</h3>
                  <p className="text-sm">
                    You have the right to request that we transfer your data to another organization,
                    or directly to you, under certain conditions.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">Right to Object</h3>
                  <p className="text-sm">
                    You have the right to object to our processing of your personal data, under certain conditions.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Legal Basis for Processing</h2>
              <p className="mb-4">We process personal data under the following legal bases:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Contract:</strong> Processing necessary for the performance of our services</li>
                <li><strong>Consent:</strong> Where you have given explicit consent for specific processing</li>
                <li><strong>Legitimate Interests:</strong> For our legitimate business interests where not overridden by your rights</li>
                <li><strong>Legal Obligation:</strong> Where processing is required by law</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Protection Measures</h2>
              <p className="mb-4">We implement appropriate technical and organizational measures to ensure security:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and penetration testing</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
                <li>Regular backups and disaster recovery plans</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Data Transfers</h2>
              <p>
                When we transfer personal data outside the EEA, we ensure appropriate safeguards
                are in place, including Standard Contractual Clauses approved by the European
                Commission, and compliance with applicable data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
              <p>
                We retain personal data only for as long as necessary to fulfill the purposes
                for which it was collected, including to satisfy legal, accounting, or reporting
                requirements. The specific retention period depends on the nature of the data
                and the purpose of processing.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Processing Agreements</h2>
              <p>
                We enter into Data Processing Agreements (DPAs) with all third-party processors
                who handle personal data on our behalf. These agreements ensure that processors
                comply with GDPR requirements and maintain appropriate security measures.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Exercising Your Rights</h2>
              <p className="mb-4">
                To exercise any of your GDPR rights, please contact our Data Protection Officer:
              </p>
              <ul className="list-none space-y-1">
                <li>Email: dpo@servicecrewai.com</li>
                <li>Address: 2807 Hampton Woods Dr, Richmond, VA 23233</li>
              </ul>
              <p className="mt-4">
                We will respond to your request within 30 days. In some cases, we may need to
                verify your identity before processing your request.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Supervisory Authority</h2>
              <p>
                You have the right to lodge a complaint with a supervisory authority if you
                believe that our processing of your personal data violates GDPR. You can contact
                the supervisory authority in your country of residence or the Irish Data Protection
                Commission (as our lead supervisory authority).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p>
                If you have any questions about GDPR compliance or data protection, please contact:
              </p>
              <ul className="list-none mt-4 space-y-1">
                <li>Data Protection Officer: dpo@servicecrewai.com</li>
                <li>General Privacy Inquiries: privacy@servicecrewai.com</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
