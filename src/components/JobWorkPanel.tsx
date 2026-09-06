"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import Link from "next/link";
import { useWorkflowFetch } from "@/hooks/useWorkflowFetch";
type Row = { id: string; [key: string]: any };
const defaultItems = [
  {
    id: "scope",
    label: "Record the agreed work scope",
    checked: false,
    notes: "",
  },
  {
    id: "work",
    label: "Record the work actually performed",
    checked: false,
    notes: "",
  },
  {
    id: "handover",
    label: "Review completed work with the customer",
    checked: false,
    notes: "",
  },
];
export default function JobWorkPanel({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Row | null>(null),
    [data, setData] = useState<Record<string, any> | null>(null),
    [lookup, setLookup] = useState<Record<string, any>>({}),
    [items, setItems] = useState(defaultItems),
    [work, setWork] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [part, setPart] = useState(""),
    [truck, setTruck] = useState(""),
    [quantity, setQuantity] = useState(1),
    [photo, setPhoto] = useState(""),
    [photoType, setPhotoType] = useState("DURING"),
    [caption, setCaption] = useState(""),
    [consent, setConsent] = useState(false),
    [technician, setTechnician] = useState("");
  const pad = useRef<SignatureCanvas | null>(null),
    mutate = useWorkflowFetch(),
    closed = job && ["COMPLETED", "INVOICED", "CANCELLED"].includes(job.status);
  const load = useCallback(async () => {
    try {
      const paths = [
          `/api/jobs/${jobId}`,
          `/api/jobs/${jobId}/execution`,
          "/api/operations/lookups",
        ],
        results = await Promise.all(
          paths.map(async (p) => {
            const r = await fetch(p),
              v = await r.json();
            if (!r.ok) throw Error(v.error || "Load failed");
            return v;
          }),
        );
      setJob(results[0]);
      setData(results[1]);
      setLookup(results[2]);
      setWork(results[0].workPerformed || "");
      setItems(results[1].checklist?.items || (["COMPLETED","INVOICED","CANCELLED"].includes(results[0].status)?[]:defaultItems));
      if (results[2].role === "TECHNICIAN") {
        setTechnician(results[2].technicians[0]?.id || "");
        setTruck(results[2].technicians[0]?.truckId || "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load job evidence");
    }
  }, [jobId]);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(path: string, body: unknown, method = "POST") {
    setBusy(true);
    setError("");
    try {
      const r = await mutate(path, body, method),
        v = await r.json();
      if (!r.ok) throw Error(v.error || "Save failed");
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      return false;
    } finally {
      setBusy(false);
    }
  }
  const complete = async () => {
    const signature =
      pad.current && !pad.current.isEmpty()
        ? pad.current.toDataURL("image/png")
        : job?.customerSignature;
    if (!signature) {
      setError("Ask the customer to sign after reviewing the work");
      return;
    }
    await save(
      `/api/jobs/${jobId}`,
      {
        status: "COMPLETED",
        updatedAt: job?.updatedAt,
        workPerformed: work,
        customerSignature: signature,
      },
      "PUT",
    );
  };
  return (
    <section className="card p-5 space-y-5">
      <h2 className="text-xl font-semibold">Field work & completion</h2>
      {error && (
        <div role="alert" className="bg-red-50 p-3 text-red-800">
          {error}{" "}
          <button className="underline" onClick={() => void load()}>
            Reload
          </button>
        </div>
      )}
      {!data ? (
        <p>Loading work record…</p>
      ) : (
        <>
          <p>
            Current status: {job?.status}. Job photos are private to authorized
            staff. All changes are saved to this job.
          </p>
          {closed&&!data.checklist&&<p>No checklist was recorded for this legacy job.</p>}
          <Link
            href="/dashboard/operations/timesheets"
            className="text-primary-700 underline"
          >
            Open timesheets and office review
          </Link>
          {!closed && (
            <div className="flex gap-2 flex-wrap">
              {lookup.role !== "TECHNICIAN" && (
                <select
                  className="select"
                  aria-label="Technician"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                >
                  <option value="">Select technician</option>
                  {lookup.technicians?.map((t: Row) => (
                    <option key={t.id} value={t.id}>
                      {t.user.firstName} {t.user.lastName}
                    </option>
                  ))}
                </select>
              )}
              {["TRAVEL", "WORK", "BREAK"].map((type) => (
                <button
                  key={type}
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() =>
                    void save("/api/operations/timesheets", {
                      action: "start",
                      jobId,
                      technicianId: technician,
                      type,
                    })
                  }
                >
                  Start {type.toLowerCase()} timer
                </button>
              ))}
              {lookup.role !== "TECHNICIAN" && (
                <button
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() =>
                    void save("/api/operations/dispatch", {
                      jobId,
                      technicianId: technician,
                      updatedAt: job?.updatedAt,
                    })
                  }
                >
                  Assign technician
                </button>
              )}
            </div>
          )}
          <div>
            {data.time?.map((t: Row) => (
              <div className="flex gap-3 border-t py-2" key={t.id}>
                <span>
                  {t.type}: {new Date(t.startTime).toLocaleString()} ·{" "}
                  {t.endTime
                    ? `${t.duration} minutes · ${t.approvalStatus}`
                    : "Running"}
                </span>
                {!t.endTime && (
                  <button
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={() =>
                      void save("/api/operations/timesheets", {
                        action: "stop",
                        id: t.id,
                        version: t.version,
                      })
                    }
                  >
                    Stop timer
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold">Job checklist</h3>
            {items.map((item, index) => (
              <div key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    disabled={!!closed}
                    checked={item.checked}
                    onChange={(e) =>
                      setItems(
                        items.map((r, i) =>
                          i === index ? { ...r, checked: e.target.checked } : r,
                        ),
                      )
                    }
                  />{" "}
                  {item.label}
                </label>
                <input
                  className="input w-full"
                  disabled={!!closed}
                  aria-label={`${item.label} evidence note`}
                  placeholder="Evidence or observation"
                  value={item.notes}
                  onChange={(e) =>
                    setItems(
                      items.map((r, i) =>
                        i === index ? { ...r, notes: e.target.value } : r,
                      ),
                    )
                  }
                />
              </div>
            ))}
            {!closed && (
              <button
                className="btn btn-secondary"
                disabled={busy}
                onClick={() =>
                  void save(`/api/jobs/${jobId}/execution`, {
                    action: "checklist",
                    version: data.checklist?.version,
                    items,
                  })
                }
              >
                Save checklist
              </button>
            )}
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold">Parts used</h3>
            {data.parts?.map((p: Row) => (
              <p key={p.id}>
                {p.part.name} · {p.quantity} × {p.unitPrice} = {p.totalPrice}
              </p>
            ))}
            {job?.status === "IN_PROGRESS" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void save("/api/operations/stock", {
                    action: "use",
                    jobId,
                    partId: part,
                    truckId: truck,
                    quantity,
                  });
                }}
                className="grid md:grid-cols-4 gap-2"
              >
                <label>
                  Part
                  <select
                    required
                    className="select w-full"
                    value={part}
                    onChange={(e) => setPart(e.target.value)}
                  >
                    <option value="">Choose…</option>
                    {lookup.parts?.map((p: Row) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Stock location
                  <select
                    className="select w-full"
                    value={truck}
                    onChange={(e) => setTruck(e.target.value)}
                  >
                    {lookup.role !== "TECHNICIAN" && (
                      <option value="">Warehouse</option>
                    )}
                    {lookup.trucks?.map((t: Row) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantity
                  <input
                    className="input w-full"
                    type="number"
                    min="1"
                    max="10000"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </label>
                <button className="btn btn-secondary" disabled={busy}>
                  Record usage
                </button>
              </form>
            )}
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold">Job photos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {data.photos?.map((p: Row) => (
                <a
                  key={p.id}
                  target="_blank"
                  rel="noreferrer"
                  href={`/api/jobs/${jobId}/photos/${p.id}`}
                  className="border rounded p-2"
                >
                  <p>
                    {p.type} · {p.caption || "Open photo"}
                  </p>
                  <small>{new Date(p.takenAt).toLocaleString()}</small>
                </a>
              ))}
            </div>
            {!closed && (
              <form
                className="space-y-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    await save(`/api/jobs/${jobId}/execution`, {
                      action: "photo",
                      media: photo,
                      type: photoType,
                      caption,
                      consent,
                    })
                  ) {
                    setPhoto("");
                    setCaption("");
                    setConsent(false);
                  }
                }}
              >
                <label>
                  PNG or JPEG, maximum 1 MB
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 1000000) {
                        setError("Photo exceeds 1 MB");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setPhoto(String(reader.result));
                      reader.onerror = () => setError("Unable to read photo");
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                <select
                  aria-label="Photo type"
                  className="select"
                  value={photoType}
                  onChange={(e) => setPhotoType(e.target.value)}
                >
                  {["BEFORE", "DURING", "AFTER", "EQUIPMENT", "PROBLEM"].map(
                    (t) => (
                      <option key={t}>{t}</option>
                    ),
                  )}
                </select>
                <input
                  className="input w-full"
                  placeholder="Caption"
                  aria-label="Photo caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
                <label className="block">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />{" "}
                  I am authorized to store this job photo.
                </label>
                <button
                  disabled={busy || !photo || !consent}
                  className="btn btn-secondary"
                >
                  Store photo
                </button>
              </form>
            )}
          </div>
          <label className="block font-semibold">
            Work performed
            <textarea
              className="input w-full mt-2"
              rows={5}
              disabled={!!closed}
              value={work}
              onChange={(e) => setWork(e.target.value)}
            />
          </label>
          {!closed && (
            <button
              className="btn btn-secondary"
              disabled={busy}
              onClick={() =>
                void save(
                  `/api/jobs/${jobId}`,
                  { workPerformed: work, updatedAt: job?.updatedAt },
                  "PUT",
                )
              }
            >
              Save work notes
            </button>
          )}
          {job?.status === "IN_PROGRESS" && (
            <div className="space-y-3">
              <h3 className="font-semibold">Customer acknowledgement</h3>
              <p>
                The customer should review the recorded work and sign below.
                This acknowledges work completion; it does not authorize
                additional charges.
              </p>
              <div className="max-w-full overflow-auto border rounded bg-white">
                <SignatureCanvas
                  ref={pad}
                  canvasProps={{
                    width: 500,
                    height: 180,
                    "aria-label": "Customer completion signature",
                  }}
                />
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => pad.current?.clear()}
              >
                Clear signature
              </button>
              <button
                disabled={busy}
                className="btn btn-primary"
                onClick={() => void complete()}
              >
                Save signature & complete job
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
