"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useWorkflowFetch } from "@/hooks/useWorkflowFetch";
type Row = {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  amount?: string;
  amountCents?: number;
  method?: string;
  source?: string;
  verifiedAt?: string;
  status?: string;
  sessionId?: string;
  providerId?: string;
  kind?: string;
  reason?: string;
  createdAt?: string;
  settledAt?:string;
  date?: string;
  balanceDue?: string;
};
type Data = {
  invoices: Row[];
  payments: Row[];
  refunds: Row[];
  checkouts: Row[];
  credits: Row[];
};
const dollars = (n: unknown) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(n),
  );
export default function Page() {
  const send = useWorkflowFetch(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [paymentId, setPaymentId] = useState(""),
    [amount, setAmount] = useState(""),
    [reason, setReason] = useState(""),
    [creditInvoice, setCredit] = useState(true),
    [cash, setCash] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    [refs, setRefs] = useState<Record<string, string>>({});
  const q = useQuery<Data>({
    queryKey: ["finance"],
    queryFn: async () => {
      const r = await fetch("/api/operations/finance"),
        j = await r.json();
      if (!r.ok) throw Error(j.error);
      return j;
    },
  });
  async function act(body: unknown) {
    setBusy(true);
    setError("");
    try {
      const r = await send("/api/operations/finance", body),
        j = await r.json();
      if (!r.ok) throw Error(j.error || "Request failed");
      await q.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  if (q.isPending) return <p>Loading finance…</p>;
  if (q.error || !q.data)
    return <p role="alert">{q.error?.message || "Finance unavailable"}</p>;
  const data = q.data,
    payment = data.payments.find((p) => p.id === paymentId),
    name = (id: string) =>
      data.invoices.find((i) => i.id === id)?.invoiceNumber || id;
  function exportReceipts() {
    const rows = [
      ["type", "id", "invoice", "amountUSD", "status", "date"],
      ...data.payments
        .filter((p) => p.verifiedAt)
        .map((p) => [
          "PAYMENT",
          p.id,
          name(p.invoiceId),
          String(p.amount),
          "VERIFIED",
          p.verifiedAt || "",
        ]),
      ...data.refunds.map((p) => [
        "REFUND",
        p.id,
        name(p.invoiceId),
        String((p.amountCents || 0) / 100),
        p.status || "",
        p.settledAt || p.createdAt || "",
      ]),
      ...data.credits.map((p) => [
        "CREDIT",
        p.id,
        name(p.invoiceId),
        String((p.amountCents || 0) / 100),
        "RECORDED",
        p.createdAt || "",
      ]),
    ];
    const csv = rows
        .map((r) =>
          r
            .map(
              (s) =>
                '"' +
                (/^[=+@\-\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""') +
                '"',
            )
            .join(","),
        )
        .join("\r\n"),
      url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      a = document.createElement("a");
    a.href = url;
    a.download = "finance-receipts.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments and reconciliation</h1>
          <p>
            Manager access · Latest 1,000 payments and 500 refunds, checkouts
            and credits.
          </p>
        </div>
        <button className="btn-secondary" onClick={exportReceipts}>
          Export displayed receipts
        </button>
      </div>
      <p>
        Successful refunds reduce net payments. A credit also reduces the amount
        owed; a refund without a credit reopens that balance. Provider outcomes
        marked UNKNOWN require reconciliation before another attempt.
      </p>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <section className="card space-y-3">
        <h2 className="font-semibold">Refund a verified payment</h2>
        <label className="block">
          Payment
          <select
            className="input"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
          >
            <option value="">Choose payment</option>
            {data.payments
              .filter(
                (p) =>
                  p.verifiedAt &&
                  (p.source === "STRIPE" || p.method === "CASH"),
              )
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {name(p.invoiceId)} · {dollars(p.amount)} · {p.method} ·{" "}
                  {p.id.slice(-8)}
                </option>
              ))}
          </select>
        </label>
        <label className="block">
          Refund amount (USD)
          <input
            className="input"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className="block">
          Reason
          <textarea
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={creditInvoice}
            onChange={(e) => setCredit(e.target.checked)}
          />
          Also credit this amount so the customer does not owe it again.
        </label>
        {payment?.method === "CASH" && (
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={cash}
              onChange={(e) => setCash(e.target.checked)}
            />
            The cash has actually been handed back.
          </label>
        )}
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I reviewed the payment, refund amount and balance effect.
        </label>
        <button
          className="btn-primary"
          disabled={
            busy ||
            !paymentId ||
            !amount ||
            !reason ||
            !confirmed ||
            (payment?.method === "CASH" && !cash)
          }
          onClick={() => {
            if (
              window.confirm(
                `Refund ${dollars(amount)}? ${creditInvoice ? "The invoice will also be credited." : "The refunded amount will become due again."}`,
              )
            )
              act({
                action: "refund",
                paymentId,
                amountCents: Math.round(Number(amount) * 100),
                reason,
                creditInvoice,
                cashReturnedConfirmed: cash,
              });
          }}
        >
          Submit reviewed refund
        </button>
      </section>
      {(["checkouts", "refunds"] as const).map((kind) => (
        <section className="card overflow-auto" key={kind}>
          <h2 className="font-semibold mb-3">
            {kind === "checkouts" ? "Online checkouts" : "Refund receipts"}
          </h2>
          {!data[kind].length ? (
            <p>No records yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Provider receipt / actions</th>
                </tr>
              </thead>
              <tbody>
                {data[kind].map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-3">
                      <Link
                        className="text-blue-700"
                        href={`/dashboard/invoices/${row.invoiceId}`}
                      >
                        {name(row.invoiceId)}
                      </Link>
                      <p className="text-xs text-gray-500">{row.reason}</p>
                    </td>
                    <td>{dollars((row.amountCents || 0) / 100)}</td>
                    <td>{row.status}</td>
                    <td className="py-3 space-y-2">
                      <p className="text-xs">
                        {row.sessionId ||
                          row.providerId ||
                          row.kind ||
                          "No receipt returned"}
                      </p>
                      {["UNKNOWN", "PENDING"].includes(row.status || "") &&
                        row.kind !== "CASH" && (
                          <>
                            <label className="block text-sm">
                              Provider{" "}
                              {kind === "checkouts" ? "session" : "refund"} ID
                              <input
                                className="input"
                                value={
                                  refs[row.id] ??
                                  row.sessionId ??
                                  row.providerId ??
                                  ""
                                }
                                onChange={(e) =>
                                  setRefs({ ...refs, [row.id]: e.target.value })
                                }
                              />
                            </label>
                            <button
                              disabled={busy}
                              className="btn-secondary"
                              onClick={() =>
                                act({
                                  action:
                                    kind === "checkouts"
                                      ? "checkout-reconcile"
                                      : "refund-reconcile",
                                  id: row.id,
                                  sessionId: refs[row.id] || row.sessionId,
                                  providerId: refs[row.id] || row.providerId,
                                })
                              }
                            >
                              Fetch verified status
                            </button>
                            {kind === "checkouts" && row.sessionId && (
                              <button
                                disabled={busy}
                                className="btn-secondary ml-2"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Expire this open checkout so it can no longer accept a payment?",
                                    )
                                  )
                                    act({
                                      action: "checkout-expire",
                                      id: row.id,
                                    });
                                }}
                              >
                                Expire checkout
                              </button>
                            )}
                          </>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
      <p>
        <Link
          className="text-blue-700"
          href="/dashboard/operations/integrations"
        >
          Configure the company payment provider →
        </Link>
      </p>
    </main>
  );
}
