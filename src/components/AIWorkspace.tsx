"use client";
import AIFormAssistant from "@/components/AIFormAssistant";
import AIDraftReport from "@/components/AIDraftReport";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useWorkflowFetch } from "@/hooks/useWorkflowFetch";
import { aiPageFields } from "@/lib/ai-page-fields";
import type { FormValues } from "@/lib/form-ai";
type Row = { id: string; [key: string]: any };
export default function AIWorkspace({initialMode="job-summary", title="AI draft workspace"}: {initialMode?:string;title?:string}) {
  const [state, setState] = useState<Record<string, any> | null>(null),
    [lookups, setLookups] = useState<Record<string, any>>({}),
    [mode, setMode] = useState(initialMode),
    [jobId, setJobId] = useState(""),
    [customerId, setCustomerId] = useState(""),
    [notes, setNotes] = useState(""),
    [extraInstructions, setExtraInstructions] = useState(""),
    [media, setMedia] = useState(""),
    [consent, setConsent] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<Row | null>(null),
    [review, setReview] = useState(""),
    [detailValues, setDetailValues] = useState<Record<string,FormValues>>({}),
    mutate = useWorkflowFetch();
  const detailFields = aiPageFields[mode] || [];
  const details = detailValues[mode] || {};
  const formName = aiPageFields[mode] ? `workspace:${mode}` : "workspace";
  const reportRef = useRef<HTMLDivElement>(null);
  const featureName = (feature: string) => state?.modes.find((m: Row) => m.slug === feature)?.name || (feature === "form-autofill" ? "Form suggestions" : feature.replaceAll("-", " "));
  function openDraft(draft: Row) {
    setSelected(draft);
    setReview(draft.reviewedText || draft.output?.draft || draft.output?.summary || "");
  }
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
      return results[0];
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
      return null;
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (selected) reportRef.current?.scrollIntoView({behavior:"smooth",block:"start"});
  }, [selected?.id]);
  async function send(body: unknown) {
    setBusy(true);
    setError("");
    try {
      const r = await mutate("/api/assistant", body),
        v = await r.json();
      if (!r.ok) throw Error(v.error || "AI request failed");
      const refreshed = await load();
      if (v.report && v.id) {
        openDraft(refreshed?.results.find((draft: Row) => draft.id === v.id) || {
          id:v.id, feature:(body as {mode:string}).mode, output:v.report,
          input:{evidence:v.evidence || []}, model:v.model, createdAt:v.createdAt, success:true,
        });
      } else if ((body as {action?:string}).action === "review" && selected) {
        const reviewed = refreshed?.results.find((draft: Row) => draft.id === selected.id);
        if (reviewed) openDraft(reviewed);
      }
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
      <h1 className="text-2xl font-bold">{title}</h1>
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
            extraInstructions,
            details,
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
              onChange={(e) => {
                const id = e.target.value;
                setJobId(id);
                const job = lookups.jobs?.find((j: Row) => j.id === id);
                if (job) setCustomerId(job.customerId);
                setError("");
              }}
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
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  const job = lookups.jobs?.find((j: Row) => j.id === jobId);
                  if (job && job.customerId !== e.target.value) setJobId("");
                  setError("");
                }}
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
        {lookups.role && lookups.role !== "TECHNICIAN" && <AIFormAssistant key={mode} form={formName} values={{ ...details, mode, jobId, customerId, extraInstructions, notes }} jobId={jobId} customerId={customerId} disabled={busy} onApply={patch => {
          if (typeof patch.notes === "string") setNotes(patch.notes);
          if (typeof patch.extraInstructions === "string") setExtraInstructions(patch.extraInstructions);
          if (typeof patch.jobId === "string") setJobId(patch.jobId);
          if (typeof patch.customerId === "string") setCustomerId(patch.customerId);
          if (typeof patch.mode === "string" && patch.mode !== mode) { setMode(patch.mode); setMedia(""); }
          const detailPatch = Object.fromEntries(Object.entries(patch).filter(([key])=>detailFields.some(f=>f.key===key)));
          setDetailValues(prev=>({...prev,[mode]:{...prev[mode],...detailPatch}}));
          setError("");
        }} />}
        {!!detailFields.length && <fieldset disabled={busy} className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2"><legend className="px-2 font-semibold text-slate-800">Workflow details</legend>{detailFields.map(field=><label key={field.key} className={`block text-sm font-medium text-slate-700 ${field.prose ? 'md:col-span-2' : ''}`}>{field.label}{field.options ? <select className="input mt-1" value={details[field.key] ?? ''} onChange={e=>setDetailValues(prev=>({...prev,[mode]:{...prev[mode],[field.key]:e.target.value}}))}><option value="">Select {field.label.toLowerCase()}…</option>{field.options.map(value=><option key={value} value={value}>{value}</option>)}</select> : field.prose ? <textarea className="input mt-1" rows={3} maxLength={4000} value={details[field.key] ?? ''} onChange={e=>setDetailValues(prev=>({...prev,[mode]:{...prev[mode],[field.key]:e.target.value}}))}/> : <input className="input mt-1" type={field.type==='date'?'date':['integer','decimal'].includes(field.type || '')?'number':'text'} min={field.type==='integer'||field.type==='decimal'?0:undefined} step={field.type==='decimal'?'0.01':undefined} maxLength={500} value={details[field.key] ?? ''} onChange={e=>setDetailValues(prev=>({...prev,[mode]:{...prev[mode],[field.key]:e.target.value}}))}/>}</label>)}</fieldset>}
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
        {!consent && <p className="text-xs text-slate-500">Review the form, then check the authorization box to enable Generate draft.</p>}
      </form>
      {selected && <div ref={reportRef} className="scroll-mt-24"><AIDraftReport key={selected.id} draft={selected} title={featureName(selected.feature)} review={review} onReviewChange={setReview} busy={busy} onClose={() => setSelected(null)} onRecordReview={() => void send({action:"review",id:selected.id,expectedHash:selected.expectedHash,reviewedText:review})}/></div>}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Recent requests</h2>
        <button className="btn btn-secondary" onClick={() => void load()}>
          Refresh status
        </button>
        {state?.requests.slice(0, 10).map((r: Row) => (
          <article className="card p-3" key={r.id}>
            <p>
              {featureName(r.feature)} · {r.state.replaceAll("_", " ").toLowerCase()} · {new Date(r.createdAt).toLocaleString()}{" "}
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
              onClick={() => openDraft(r)}
            >
              {featureName(r.feature)} · {new Date(r.createdAt).toLocaleString()}
            </button>
            <p>
              {r.success
                ? r.reviewedAt
                  ? "Reviewed"
                  : "Unreviewed draft"
                : "Failed generation"}{" "}
              · {r.model}
            </p>
          </article>
        ))}
      </section>

    </main>
  );
}
