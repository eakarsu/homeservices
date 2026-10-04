'use client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Invoice = {
  id: string; invoiceNumber: string; status: string; reviewedAt: string | null; dueDate: string;
  subtotal: string; taxAmount: string; totalAmount: string; paidAmount: string; balanceDue: string; creditCents: number;
  customer: { firstName: string; lastName: string; companyName: string | null };
  lineItems: { id: string; description: string; quantity: string; unitPrice: string; totalPrice: string }[];
  payments: { id: string; amount: string; method: string; reference: string | null; verifiedAt: string | null; date: string }[];
};
const money = (value: unknown) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));

export default function TechInvoicePage() {
  const search = useSearchParams();
  const id = search.get('id');
  const jobId = search.get('jobId');
  const query = useQuery<Invoice>({ queryKey: ['tech-invoice', id], enabled: !!id, queryFn: async () => {
    const response = await fetch(`/api/invoices/${encodeURIComponent(id!)}`);
    const data = await response.json();
    if (!response.ok) throw Error(data.error || 'Invoice unavailable');
    return data;
  } });
  if (!id) return <p role="alert">Open an invoice from an assigned job.</p>;
  if (query.isPending) return <p>Loading invoice…</p>;
  if (query.error || !query.data) return <p role="alert">{query.error?.message || 'Invoice unavailable'} <button className="underline" onClick={() => void query.refetch()}>Retry</button></p>;
  const invoice = query.data;
  return <main className="space-y-4 pb-20">
    {jobId && <Link className="underline" href={`/tech/job/${encodeURIComponent(jobId)}`}>← Job</Link>}
    <header><h1 className="text-xl font-bold">Invoice {invoice.invoiceNumber}</h1><p>{invoice.status} · Due {invoice.dueDate.slice(0, 10)}</p>
      <p>{invoice.customer.companyName || `${invoice.customer.firstName} ${invoice.customer.lastName}`}</p></header>
    {!invoice.reviewedAt && <p className="rounded bg-amber-50 p-3 text-amber-800">Office review is required before this invoice can be issued or paid.</p>}
    <section className="card p-4 space-y-2"><h2 className="font-semibold">Line items</h2>
      {invoice.lineItems.map((line) => <p key={line.id}>{line.description} · {line.quantity} × {money(line.unitPrice)} = {money(line.totalPrice)}</p>)}
    </section>
    <section className="card p-4 space-y-2"><h2 className="font-semibold">Balance</h2>
      <p>Subtotal {money(invoice.subtotal)} · Tax {money(invoice.taxAmount)}</p><p>Total {money(invoice.totalAmount)} · Credits {money(invoice.creditCents / 100)} · Verified payments {money(invoice.paidAmount)}</p>
      <p className="font-bold">Balance due {money(invoice.balanceDue)}</p>
    </section>
    <section className="card p-4 space-y-2"><h2 className="font-semibold">Payment evidence</h2>
      {!invoice.payments.length && <p>No payment is recorded.</p>}
      {invoice.payments.map((payment) => <p key={payment.id}>{money(payment.amount)} · {payment.method} · {payment.verifiedAt ? `Verified ${new Date(payment.verifiedAt).toLocaleString()}` : 'Awaiting verification'}{payment.reference ? ` · Reference ${payment.reference}` : ''}</p>)}
      <p className="text-sm text-gray-600">Only the office can issue invoices, initiate card checkout, and reconcile payments. Ask the office to use the invoice review screen for those actions.</p>
    </section>
  </main>;
}
