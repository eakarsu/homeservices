'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import JobWorkPanel from '@/components/JobWorkPanel';
import { useWorkflowFetch } from '@/hooks/useWorkflowFetch';

type Job = {
  id: string; customerId: string; title: string; status: string; updatedAt: string; description: string | null;
  estimates: { id: string; estimateNumber: string; status: string }[];
  invoices: { id: string; invoiceNumber: string; status: string; balanceDue: string; reviewedAt: string | null }[];
};
export default function Page() {
  const id = String(useParams().id);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState('');
  const mutate = useWorkflowFetch();
  useEffect(() => {
    fetch(`/api/jobs/${id}`).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Job unavailable');
      setJob(data);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Job unavailable'));
  }, [id]);
  async function status(next: string) {
    const response = await mutate(`/api/jobs/${id}`, { status: next, updatedAt: job?.updatedAt }, 'PUT');
    const data = await response.json();
    if (!response.ok) setError(data.error || 'Status change failed');
    else setJob((current) => current ? { ...current, ...data } : data);
  }
  return <div className="space-y-4"><Link href="/tech">← My jobs</Link>
    <h1 className="text-xl font-bold">{job?.title || 'Job'}</h1>
    {error && <p role="alert">{error}</p>}
    <p>{job?.description}</p>
    {job && <Link className="btn btn-secondary inline-block" href={`/tech/estimate?jobId=${encodeURIComponent(job.id)}&customerId=${encodeURIComponent(job.customerId)}`}>Draft pricebook estimate</Link>}
    {job && ['SCHEDULED', 'DISPATCHED', 'ON_HOLD', 'EN_ROUTE'].includes(job.status) && <div className="flex gap-2">
      {job.status !== 'EN_ROUTE' && <button className="btn btn-secondary" onClick={() => void status('EN_ROUTE')}>En route</button>}
      <button className="btn btn-primary" onClick={() => void status('IN_PROGRESS')}>Start work</button>
    </div>}
    {job && <section className="card p-4 space-y-2"><h2 className="font-semibold">Estimates and invoices</h2>
      {!job.estimates.length && !job.invoices.length && <p>No estimate or invoice is linked to this job yet.</p>}
      {job.estimates.map((estimate) => <p key={estimate.id}><Link className="underline" href={`/dashboard/estimates/${estimate.id}`}>{estimate.estimateNumber}</Link> · {estimate.status}</p>)}
      {job.invoices.map((invoice) => <p key={invoice.id}><Link className="underline" href={`/tech/invoice?id=${encodeURIComponent(invoice.id)}&jobId=${encodeURIComponent(job.id)}`}>{invoice.invoiceNumber}</Link> · {invoice.status} · Balance ${Number(invoice.balanceDue).toFixed(2)}{!invoice.reviewedAt && ' · office review required'}</p>)}
    </section>}
    <JobWorkPanel key={job?.updatedAt} jobId={id}/>
  </div>;
}
