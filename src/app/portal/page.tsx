"use client";
import { useEffect, useState } from "react";
import { useWorkflowFetch } from "@/hooks/useWorkflowFetch";
type Row = { id: string; [key: string]: any };
export default function PortalPage() {
  const [token, setToken] = useState(""),
    [data, setData] = useState<Record<string, any> | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [service, setService] = useState(""),
    [property, setProperty] = useState(""),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [notes, setNotes] = useState(""),
    mutate = useWorkflowFetch();
  useEffect(() => {
    const t = window.location.hash.slice(1);
    setToken(t);
    if (t) void load(t);
    else setError("Open the private link provided by the service office.");
  }, []);
  async function load(t = token) {
    try {
      const r = await fetch(`/api/portal/access/${encodeURIComponent(t)}`),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to open portal");
    }
  }
  async function send(body: unknown) {
    setBusy(true);
    setError("");
    try {
      const r = await mutate(
          `/api/portal/access/${encodeURIComponent(token)}`,
          body,
        ),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (d.url) {
        const u = new URL(d.url);
        if (u.protocol !== "https:" || u.hostname !== "checkout.stripe.com")
          throw Error("Unexpected payment destination");
        window.location.assign(u.href);
        return true;
      }
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Your service portal</h1>
      {error && (
        <p role="alert" className="bg-red-50 text-red-800 p-4">
          {error}
        </p>
      )}
      {data && (
        <>
          <p>
            Welcome, {data.customer.name}. Company timezone: {data.timezone}.
            Date inputs use your device timezone.
          </p>
          <section className="card p-5 space-y-3">
            <h2 className="text-lg font-semibold">Contact preferences</h2>
            <label className="block">
              <input
                type="checkbox"
                checked={data.customer.doNotEmail}
                disabled={busy}
                onChange={(e) =>
                  void send({
                    action: "preferences",
                    doNotEmail: e.target.checked,
                    doNotText: data.customer.doNotText,
                  })
                }
              />{" "}
              Do not email me
            </label>
            <label className="block">
              <input
                type="checkbox"
                checked={data.customer.doNotText}
                disabled={busy}
                onChange={(e) =>
                  void send({
                    action: "preferences",
                    doNotEmail: data.customer.doNotEmail,
                    doNotText: e.target.checked,
                  })
                }
              />{" "}
              Do not text me
            </label>
          </section>
          <section className="card p-5 space-y-4">
            <h2 className="text-lg font-semibold">Request a visit</h2>
            <p>
              Your request is pending until the office confirms availability.
            </p>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  await send({
                    action: "book",
                    serviceTypeId: service,
                    propertyId: property,
                    startAt: new Date(start).toISOString(),
                    endAt: new Date(end).toISOString(),
                    notes,
                  })
                ) {
                  setNotes("");
                  setStart("");
                  setEnd("");
                }
              }}
            >
              <label className="block">
                Service
                <select
                  className="select w-full"
                  required
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  <option value="">Choose…</option>
                  {data.services.map((s: Row) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                Property
                <select
                  className="select w-full"
                  required
                  value={property}
                  onChange={(e) => setProperty(e.target.value)}
                >
                  <option value="">Choose…</option>
                  {data.properties.map((s: Row) => (
                    <option key={s.id} value={s.id}>
                      {s.address}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                Preferred start
                <input
                  className="input w-full"
                  type="datetime-local"
                  required
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </label>
              <label className="block">
                Preferred end
                <input
                  className="input w-full"
                  type="datetime-local"
                  required
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </label>
              <label className="block">
                Request details
                <textarea
                  className="input w-full"
                  maxLength={4000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              <button disabled={busy} className="btn btn-primary">
                Request visit
              </button>
            </form>
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Visit requests</h2>
            {data.bookings.map((b: Row) => (
              <article className="card p-4" key={b.id}>
                <p>
                  {b.title} · {b.status} ·{" "}
                  {new Date(b.startAt).toLocaleString()}
                </p>
                {["REQUESTED", "CONFIRMED"].includes(b.status) && (
                  <button
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={() => {
                      const notes = window.prompt("Cancellation reason");
                      if (notes)
                        void send({
                          action: "cancel",
                          id: b.id,
                          version: b.version,
                          notes,
                        });
                    }}
                  >
                    Cancel request
                  </button>
                )}
                {b.status === "CONFIRMED" && (
                  <p>Contact the office to reschedule a confirmed visit.</p>
                )}
              </article>
            ))}
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Service history & reviews</h2>
            {data.jobs.map((j: Row) => (
              <article className="card p-4" key={j.id}>
                <p>
                  {j.jobNumber} · {j.title} · {j.status}
                </p>
                {j.scheduledStart && (
                  <p>{new Date(j.scheduledStart).toLocaleString()}</p>
                )}
                {["COMPLETED", "INVOICED"].includes(j.status) &&
                  !data.reviews.some((r: Row) => r.jobId === j.id) && (
                    <button
                      className="btn btn-secondary"
                      disabled={busy}
                      onClick={() => {
                        const rating = Number(
                            window.prompt("Your rating, from 1 to 5"),
                          ),
                          comment = rating
                            ? window.prompt("Your feedback (optional)")
                            : null;
                        if (rating && comment !== null)
                          void send({
                            action: "review",
                            jobId: j.id,
                            rating,
                            comment,
                          });
                      }}
                    >
                      Review this visit
                    </button>
                  )}
                {data.reviews
                  .filter((r: Row) => r.jobId === j.id)
                  .map((r: Row) => (
                    <p key={r.id}>
                      Your review: {r.rating}/5 · {r.comment}
                    </p>
                  ))}
              </article>
            ))}
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Invoices</h2>
            {data.invoices.map((i: Row) => (
              <article className="card p-4" key={i.id}>
                <h3>
                  {i.invoiceNumber} · {i.status}
                </h3>
                {i.lineItems.map((l: Row, index: number) => (
                  <p key={index}>
                    {l.description} · {l.quantity} × {l.unitPrice} ={" "}
                    {l.totalPrice}
                  </p>
                ))}
                <p>
                  Total: {i.totalAmount} · Paid: {i.paidAmount} · Balance:{" "}
                  {i.balanceDue} · Credits: {(i.creditCents / 100).toFixed(2)}
                </p>
                <p>
                  Due {new Date(i.dueDate).toLocaleDateString()}. Contact the
                  office with questions about this invoice.
                </p>
                {i.reviewedAt &&
                  Number(i.balanceDue) > 0 &&
                  i.status !== "VOID" && (
                    <button
                      disabled={busy}
                      className="btn-primary mt-3"
                      onClick={() =>
                        send({ action: "checkout", invoiceId: i.id })
                      }
                    >
                      Pay securely with Stripe
                    </button>
                  )}
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
