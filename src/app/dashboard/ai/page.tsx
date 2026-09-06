import Link from 'next/link'
import { SparklesIcon, DocumentTextIcon, ClipboardDocumentCheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

const availableFeatures = [
  {name:'AI draft workspace',description:'Prepare 17 evidence-backed drafts, including intake, job summaries, scheduling, maintenance, inventory, photo and voice intake. Inspect saved sources and record your review.',href:'/dashboard/assistant',icon:SparklesIcon,action:'Open draft workspace'},
  {
    name: 'Quote Generator',
    description: 'Prepare Good / Better / Best quote drafts using a selected job and your company pricebook. Review scope and pricing before delivering an estimate.',
    href: '/dashboard/ai/quote-generator',
    icon: DocumentTextIcon,
    action: 'Prepare a quote draft',
  },
  {
    name: 'Follow-up Assistant',
    description: 'Draft customer messages, task notes, and checklists from a customer and job. Edit the draft before saving. Messages are not sent automatically.',
    href: '/dashboard/follow-ups',
    icon: ClipboardDocumentCheckIcon,
    action: 'Open follow-ups',
  },
]

const plannedFeatures = [
  { name: 'Dispatch Optimizer', description: 'Recommend technician assignments using skills, job priority, and availability.' },
  { name: 'Diagnostics Assistant', description: 'Prepare possible causes and questions for a qualified technician to review.' },
  { name: 'Smart Scheduling', description: 'Suggest appointment times while checking availability and scheduling conflicts.' },
  { name: 'Predictive Maintenance', description: 'Flag equipment that may need attention using service history and equipment records.' },
  { name: 'Customer Insights', description: 'Summarize service history and potential follow-up opportunities.' },
  { name: 'Job Summary', description: 'Turn technician notes into a draft work report for review.' },
  { name: 'Inventory Forecast', description: 'Suggest reorder quantities from stock levels and recorded parts usage.' },
  { name: 'Photo Intake', description: 'Extract equipment details from photos for confirmation before saving.' },
  { name: 'Subscription Health Monitor', description: 'Identify service agreements that need a visit or renewal review.' },
  { name: 'Route Optimizer', description: 'Suggest a daily job sequence using travel estimates and appointment windows.' },
]

export default function AIPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <SparklesIcon className="h-7 w-7 text-primary-600" /> AI Features
        </h1>
        <p className="mt-2 text-gray-600">Prepare drafts for review using your existing customer, job, and pricebook records.</p>
      </div>

      <section aria-labelledby="available-ai-heading" className="space-y-4">
        <h2 id="available-ai-heading" className="section-title">Available workflows</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableFeatures.map(feature => (
            <Link key={feature.name} href={feature.href} className="card hover:shadow-md transition-shadow group">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-primary-50 p-3 text-primary-600"><feature.icon className="h-6 w-6" /></div>
                <div>
                  <span className="badge badge-success">Review required</span>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">{feature.name}</h3>
                  <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-700">
                    {feature.action}<ArrowRightIcon className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-sm text-gray-500">AI generation requires a configured provider. Check every draft against the actual job before using it.</p>
      </section>

      <section aria-labelledby="planned-ai-heading" className="space-y-4">
        <div>
          <h2 id="planned-ai-heading" className="section-title">Draft workflow coverage</h2>
          <p className="text-sm text-gray-600">These workflows are available as reviewable drafts in the AI workspace. Dispatch and scheduling still require deterministic checks before an assignment is saved.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plannedFeatures.map(feature => (
            <article key={feature.name} className="card">
              <Link href="/dashboard/assistant" className="badge badge-gray">Open in draft workspace</Link>
              <h3 className="mt-2 font-semibold text-gray-900">{feature.name}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
