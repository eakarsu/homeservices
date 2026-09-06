"use client";
import InvoiceDraftEditor from "@/components/InvoiceDraftEditor";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkflowFetch } from "@/hooks/useWorkflowFetch";
type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  version: number;
  reviewedAt: string | null;
  dueDate: string;
  subtotal: string;
  taxAmount: string;
  taxRate:string;
  totalAmount: string;
  paidAmount: string;
  balanceDue: string;
  creditCents: number;
  notes: string;
  terms: string;
  customer: { firstName: string; lastName: string; companyName: string };
  lineItems: {
    id: string;
    description: string;
    quantity: string;
    unitPrice: string;
    totalPrice: string;
  }[];
  payments: {
    id: string;
    amount: string;
    method: string;
    reference: string;
    verifiedAt: string | null;
    date: string;
  }[];
};
const usd = (n: unknown) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(n),
  );
export default function Page() {
  const id = String(useParams().id),
    send = useWorkflowFetch(),
    cache = useQueryClient(),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [review, setReview] = useState(false),
    [contact, setContact] = useState(false),
    [received, setReceived] = useState(false),
    [amount, setAmount] = useState(""),
    [method, setMethod] = useState("CASH"),
    [reference, setReference] = useState(""),
    [reason, setReason] = useState(""),
    [credit, setCredit] = useState("");
  const q = useQuery<Invoice>({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const r = await fetch(`/api/invoices/${id}`),
        j = await r.json();
      if (!r.ok) throw Error(j.error);
      return j;
    },
  });
  async function act(path: string, body: unknown, verb = "POST") {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await send(path, body, verb),
        j = await r.json();
      if (!r.ok) throw Error(j.error || "Request failed");
      await cache.invalidateQueries({ queryKey: ["invoice", id] });
      if (j.url) {
        const u = new URL(j.url);
        if (u.protocol !== "https:" || u.hostname !== "checkout.stripe.com")
          throw Error("Unexpected payment destination");
        window.location.assign(u.href);
      } else
        setNotice(
          path.endsWith("/send")
            ? "Message draft saved. Review and send it from Communications."
            : "Saved.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  if (q.isPending) return <p>Loading invoice…</p>;
  if (q.error || !q.data)
    return (
      <div role="alert">
        {q.error?.message || "Invoice unavailable"}{" "}
        <button onClick={() => q.refetch()}>Retry</button>
      </div>
    );
  const i = q.data,
    payable = !!i.reviewedAt && Number(i.balanceDue) > 0 && i.status !== "VOID";
  return (
    <main className="space-y-6">
      <Link href="/dashboard/invoices">← Invoices</Link>
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{i.invoiceNumber}</h1>
          <p>
            {i.status} · Version {i.version} · Due {i.dueDate.slice(0, 10)}
          </p>
          <p>
            {i.customer.companyName ||
              `${i.customer.firstName || ""} ${i.customer.lastName || ""}`}
          </p>
        </div>
        <button
          className="btn-secondary print:hidden"
          onClick={() => window.print()}
        >
          Print invoice
        </button>
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-green-700">
          {notice}
        </p>
      )}
      {!i.reviewedAt && i.status !== "DRAFT" && (
        <p className="p-4 bg-amber-50">
          This legacy invoice has no recorded review. Its historical balances
          are retained; it cannot accept new payments until the office
          reconciles and replaces it with a reviewed invoice.
        </p>
      )}
      <section className="card overflow-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {i.lineItems.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="py-3">{l.description}</td>
                <td>{l.quantity}</td>
                <td>{usd(l.unitPrice)}</td>
                <td>{usd(l.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="mt-4 grid grid-cols-2 gap-2">
          <dt>Subtotal</dt>
          <dd>{usd(i.subtotal)}</dd>
          <dt>Tax</dt>
          <dd>{usd(i.taxAmount)}</dd>
          <dt>Total</dt>
          <dd>{usd(i.totalAmount)}</dd>
          <dt>Credit notes</dt>
          <dd>{usd(i.creditCents / 100)}</dd>
          <dt>Net payments</dt>
          <dd>{usd(i.paidAmount)}</dd>
          <dt>Outstanding</dt>
          <dd className="font-bold">{usd(i.balanceDue)}</dd>
        </dl>
        <p className="mt-4 whitespace-pre-wrap">{i.terms}</p>
        <p className="mt-4 whitespace-pre-wrap">{i.notes}</p>
      </section>
      {i.status==="DRAFT"&&<InvoiceDraftEditor key={i.version} invoice={i} onSaved={()=>void cache.invalidateQueries({queryKey:["invoice",id]})}/>}
      <div className="grid lg:grid-cols-2 gap-6 print:hidden">
        {i.status === "DRAFT" && (
          <section className="card space-y-3">
            <h2 className="font-semibold">Review and issue</h2>
            <p>
              A manager must review scope, quantities, prices and tax before the
              invoice becomes payable.
            </p>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={review}
                onChange={(e) => setReview(e.target.checked)}
              />
              I reviewed the invoice and tax calculation.
            </label>
            <button
              disabled={busy || !review}
              className="btn-primary"
              onClick={() =>
                act(
                  `/api/invoices/${id}`,
                  {
                    action: "issue",
                    version: i.version,
                    reviewConfirmed: review,
                  },
                  "PUT",
                )
              }
            >
              Issue invoice
            </button>
          </section>
        )}
        {i.reviewedAt && i.status !== "VOID" && (
          <section className="card space-y-3">
            <h2 className="font-semibold">Customer message</h2>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={contact}
                onChange={(e) => setContact(e.target.checked)}
              />
              The customer authorized service email contact.
            </label>
            <button
              disabled={busy || !contact}
              className="btn-primary"
              onClick={() =>
                act(`/api/invoices/${id}/send`, {
                  version: i.version,
                  contactAuthorized: contact,
                })
              }
            >
              Prepare invoice email
            </button>
            <p>
              <Link
                className="text-blue-700"
                href="/dashboard/operations/communications"
              >
                Review drafts and delivery receipts →
              </Link>
            </p>
            <p>
              <Link
                className="text-blue-700"
                href="/dashboard/operations/portal"
              >
                Create a private customer portal link →
              </Link>
            </p>
          </section>
        )}
        {payable && (
          <section className="card space-y-3">
            <h2 className="font-semibold">Record funds received</h2>
            <label className="block">
              Amount (USD)
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                max={i.balanceDue}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label className="block">
              Method
              <select
                className="input"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option>CASH</option>
                <option>CHECK</option>
                <option>ACH</option>
              </select>
            </label>
            <label className="block">
              Reference (required for check or ACH)
              <input
                className="input"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </label>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={received}
                onChange={(e) => setReceived(e.target.checked)}
              />
              I confirm these funds have actually been received.
            </label>
            <button
              className="btn-primary"
              disabled={busy || !received || !amount}
              onClick={() =>
                act(`/api/invoices/${id}/payment`, {
                  amount,
                  method,
                  reference,
                  receivedConfirmed: received,
                })
              }
            >
              Record payment
            </button>
            <hr />
            <p>
              Card payments use the configured company Stripe account and
              require a verified receipt.
            </p>
            <button
              className="btn-secondary"
              disabled={busy}
              onClick={() =>
                act("/api/stripe/create-checkout", { invoiceId: id })
              }
            >
              Open Stripe checkout
            </button>
          </section>
        )}
        {i.status !== "VOID" && (
          <section className="card space-y-3">
            <h2 className="font-semibold">Manager adjustments</h2>
            <label className="block">
              Reason
              <textarea
                className="input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            {payable && (
              <>
                <label className="block">
                  Credit amount (USD)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={i.balanceDue}
                    className="input"
                    value={credit}
                    onChange={(e) => setCredit(e.target.value)}
                  />
                </label>
                <button
                  className="btn-secondary"
                  disabled={busy || !reason || !credit}
                  onClick={() =>
                    act(
                      `/api/invoices/${id}`,
                      {
                        action: "credit",
                        version: i.version,
                        reason,
                        amount: credit,
                      },
                      "PUT",
                    )
                  }
                >
                  Apply credit note
                </button>
              </>
            )}
            {!i.payments.length && (
              <button
                className="btn-secondary"
                disabled={busy || !reason}
                onClick={() => {
                  if (
                    window.confirm(
                      "Void this unpaid invoice and retain its history?",
                    )
                  )
                    act(
                      `/api/invoices/${id}`,
                      { action: "void", version: i.version, reason },
                      "PUT",
                    );
                }}
              >
                Void unpaid invoice
              </button>
            )}
            <p>
              <Link className="text-blue-700" href="/dashboard/finance">
                Refunds and provider reconciliation →
              </Link>
            </p>
          </section>
        )}
      </div>
      <section className="card overflow-auto">
        <h2 className="font-semibold mb-3">Payment receipts</h2>
        {!i.payments.length ? (
          <p>No payments recorded.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {i.payments.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="py-3">{p.date.slice(0, 10)}</td>
                  <td>{usd(p.amount)}</td>
                  <td>{p.method}</td>
                  <td>{p.reference || "—"}</td>
                  <td>
                    {p.verifiedAt ? "Recorded receipt" : "Legacy; not verified"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
