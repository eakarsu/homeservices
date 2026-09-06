"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useWorkflowFetch } from "@/hooks/useWorkflowFetch";
type Row = { id: string; [key: string]: any };
export default function Page() {
  const [state, setState] = useState<Record<string, any> | null>(null),
    [lookups, setLookups] = useState<Record<string, any>>({}),
    [mode, setMode] = useState("job-summary"),
    [jobId, setJobId] = useState(""),
    [customerId, setCustomerId] = useState(""),
    [notes, setNotes] = useState(""),
    [media, setMedia] = useState(""),
    [consent, setConsent] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<Row | null>(null),
    [review, setReview] = useState(""),
    mutate = useWorkflowFetch();
  const load = useCallback(async () => {
    try {
      const results = await Promise.all(
        ["/api/assistant", "/api/operations/lookups"].map(async (p) => {
          const r = await fetch(p),
            v = await r.json();
          if (!r.ok) throw Error(v.error || "Unable to load");
          return v;
        }),
      );
      setState(results[0]);
      setLookups(results[1]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function send(body: unknown) {
    setBusy(true);
    setError("");
    try {
      const r = await mutate("/api/assistant", body),
        v = await r.json();
      if (!r.ok) throw Error(v.error || "AI request failed");
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI request failed");
      await load();
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="max-w-6xl space-y-5">
      <Link href="/dashboard/ai" className="text-primary-700">
        ← AI features
      </Link>
      <h1 className="text-2xl font-bold">AI draft workspace</h1>
      <p>
        Draft from company records and supplied evidence. Review recommendations
        before changing records, assigning work or contacting customers.
      </p>
      {error && (
        <p role="alert" className="bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}
      {state && !state.configured && (
        <p className="bg-amber-50 p-4">
          AI provider is not configured. Set the server API key to generate
          drafts.
        </p>
      )}
      {state && (
        <p>
          Allowance: {state.policy.hourlyCalls} requests per user/hour, $
          {state.policy.dailyMicros / 1000000} daily company budget allowance.
          Each request reserves ${state.policy.reservationMicros / 1000000}{" "}
          until actual cost is known. Provider charges, including uncertain
          outcomes, require reconciliation.
        </p>
      )}
      <form
        className="card p-5 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          await send({
            mode,
            jobId,
            customerId,
            notes,
            ...(media ? { media } : {}),
            consent,
          });
        }}
      >
        <label className="block">
          Workflow
          <select
            className="select w-full"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              setMedia("");
            }}
          >
            {state?.modes.map((m: Row) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <p>{state?.modes.find((m: Row) => m.slug === mode)?.instruction}</p>
        <div className="grid md:grid-cols-2 gap-3">
          <label>
            Authorized job
            <select
              className="select w-full"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
            >
              <option value="">No job selected</option>
              {lookups.jobs?.map((j: Row) => (
                <option key={j.id} value={j.id}>
                  {j.jobNumber} · {j.title}
                </option>
              ))}
            </select>
          </label>
          {lookups.role !== "TECHNICIAN" && (
            <label>
              Customer
              <select
                className="select w-full"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">No customer selected</option>
                {lookups.customers?.map((c: Row) => (
                  <option key={c.id} value={c.id}>
                    {[c.firstName, c.lastName].filter(Boolean).join(" ") ||
                      c.companyName}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <label className="block">
          Question or additional intake notes
          <textarea
            className="input w-full"
            rows={5}
            maxLength={12000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        {["photo-intake", "voice-intake"].includes(mode) && (
          <label className="block">
            {mode === "photo-intake" ? "PNG/JPEG photo" : "WAV/MP3 audio"}{" "}
            (maximum 1 MB)
            <input
              type="file"
              required
              accept={
                mode === "photo-intake"
                  ? "image/png,image/jpeg"
                  : "audio/wav,audio/mpeg"
              }
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 1000000) {
                  setError("File exceeds 1 MB");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => setMedia(String(reader.result));
                reader.readAsDataURL(f);
              }}
            />
          </label>
        )}
        <label className="block">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />{" "}
          I am authorized to send the selected records, notes and media to the
          configured AI provider.
        </label>
        <button
          className="btn btn-primary"
          disabled={busy || !consent || !state?.configured}
        >
          {busy ? "Preparing draft…" : "Generate draft"}
        </button>
      </form>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Recent requests</h2>
        <button className="btn btn-secondary" onClick={() => void load()}>
          Refresh status
        </button>
        {state?.requests.slice(0, 10).map((r: Row) => (
          <article className="card p-3" key={r.id}>
            <p>
              {r.feature} · {r.state} · {new Date(r.createdAt).toLocaleString()}{" "}
              ·{" "}
              {r.actualMicros === null
                ? "Cost not confirmed"
                : `$${(r.actualMicros / 1000000).toFixed(6)}`}
            </p>
            {r.state === "PROCESSING" && (
              <button
                className="btn btn-secondary"
                onClick={() => void send({ action: "cancel", id: r.id })}
              >
                Cancel draft (provider charges may still apply)
              </button>
            )}
          </article>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Saved drafts</h2>
        {state?.results.map((r: Row) => (
          <article key={r.id} className="card p-4">
            <button
              className="font-semibold text-primary-700"
              onClick={() => {
                setSelected(r);
                setReview(
                  r.reviewedText || r.output?.draft || r.output?.summary || "",
                );
              }}
            >
              {r.feature} · {new Date(r.createdAt).toLocaleString()}
            </button>
            <p>
              {r.success
                ? r.reviewedAt
                  ? "Reviewed"
                  : "Unreviewed draft"
                : "Failed generation"}{" "}
              · {r.model} · Provider receipt: {r.providerReceipt || "None"}
            </p>
          </article>
        ))}
      </section>
      {selected && (
        <section className="card p-5 space-y-4">
          <h2 className="text-xl font-semibold">Review {selected.feature}</h2>
          <p className="whitespace-pre-wrap">{selected.output?.summary}</p>
          <p className="whitespace-pre-wrap">{selected.output?.draft}</p>
          {selected.output?.recommendations?.map((r: Row, i: number) => (
            <p key={i}>
              {r.text}
              <br />
              <small>
                Sources:{" "}
                {r.sourceIds?.join(", ") ||
                  "Supplied notes or media; unverified"}
              </small>
            </p>
          ))}
          {selected.output?.uncertainties?.length > 0 && (
            <ul className="list-disc pl-5">
              {selected.output.uncertainties.map((u: string, i: number) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          )}
          <details>
            <summary className="cursor-pointer font-medium">
              Inspect saved source evidence
            </summary>
            {selected.input?.evidence?.map((e: Row) => (
              <article key={e.id} className="border-t py-3">
                <h3>
                  {e.label} · {e.type} · {e.id}
                </h3>
                <pre className="whitespace-pre-wrap break-words text-sm">
                  {JSON.stringify(e.facts, null, 2)}
                </pre>
              </article>
            ))}
          </details>
          {selected.success && !selected.reviewedAt && (
            <>
              <label className="block">
                Edited draft after review
                <textarea
                  className="input w-full"
                  rows={8}
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                />
              </label>
              <button
                className="btn btn-primary"
                disabled={busy || !review.trim()}
                onClick={async () => {
                  if (
                    await send({
                      action: "review",
                      id: selected.id,
                      expectedHash: selected.expectedHash,
                      reviewedText: review,
                    })
                  ) {
                    setSelected(null);
                    setReview("");
                  }
                }}
              >
                Record review
              </button>
            </>
          )}
          {selected.reviewedAt && (
            <p className="whitespace-pre-wrap">
              Reviewed draft: {selected.reviewedText}
            </p>
          )}
        </section>
      )}
    </main>
  );
}
