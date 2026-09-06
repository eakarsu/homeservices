"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  recordModules,
  operationsModules,
  type Field,
} from "@/lib/workflows/definitions";
import { useWorkflowFetch } from "@/hooks/useWorkflowFetch";
// API responses are rendered using explicit fields; unknown internal fields are never dumped into the page.
type Row = { id: string; [key: string]: any };
type Lookups = {
  role: string;
  company: { name: string; timezone: string };
  [key: string]: any;
};
const base = "input w-full";
const local = (s?: string) => {
  if (!s) return "";
  const d = new Date(s);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
const timestamp = (s: string) => (s ? new Date(s).toISOString() : "");
export default function OperationsPage({ module }: { module: string }) {
  const [rows, setRows] = useState<Row[]>([]),
    [lookup, setLookup] = useState<Lookups | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [form, setForm] = useState<Record<string, any>>({}),
    [selected, setSelected] = useState<Row | null>(null),
    [link, setLink] = useState(""),
    [search, setSearch] = useState("");
  const mutate = useWorkflowFetch(),
    definition = recordModules[module],
    name =
      definition?.name ||
      operationsModules.find((m) => m.slug === module)?.name ||
      module,
    manager = lookup && ["ADMIN", "MANAGER"].includes(lookup.role),
    office = lookup?.role !== "TECHNICIAN";
  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        fetch(`/api/operations/${module}`),
        fetch("/api/operations/lookups"),
      ]);
      const [r, l] = await Promise.all([a.json(), b.json()]);
      if (!a.ok || !b.ok)
        throw Error(r.error || l.error || "Unable to load operations");
      setRows(module === "workforce" ? r.technicians : r);
      setLookup({ ...l, timeOff: r.timeOff || [] });
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load");
    }
  }, [module]);
  useEffect(() => {
    setRows([]);
    setSelected(null);
    setForm({});
    setLoaded(false);
    setError("");
    void load();
  }, [load]);
  const change = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));
  async function send(body: Record<string, unknown>, clear = true) {
    setBusy(true);
    setError("");
    try {
      const r = await mutate(`/api/operations/${module}`, body),
        data = await r.json();
      if (!r.ok) throw Error(data.error || "Save failed");
      if (data.url) setLink(data.url);
      if (clear) {
        setSelected(null);
        setForm({});
      }
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      return false;
    } finally {
      setBusy(false);
    }
  }
  function edit(row: Row) {
    setSelected(row);
    setForm({
      ...row,
      ...(row.data || {}),
      startAt: local(row.startAt),
      endAt: local(row.endAt),
      scheduledAt: local(row.scheduledAt),
      ...(row.data
        ? Object.fromEntries(
            Object.entries(row.data).map(([k, v]) => [
              k,
              definition?.fields.find((f) => f.key === k)?.type ===
              "datetime-local"
                ? local(String(v))
                : v,
            ]),
          )
        : {}),
    });
    setError("");
  }
  const options = (kind: string) =>
    ((lookup?.[kind] || []) as Row[])
      .filter(
        (r) =>
          kind !== "properties" ||
          !form.customerId ||
          r.customerId === form.customerId,
      )
      .map((r) => ({
        id: r.id,
        label:
          r.title ||
          r.name ||
          r.address ||
          (r.user
            ? `${r.user.firstName} ${r.user.lastName}`
            : [r.firstName, r.lastName].filter(Boolean).join(" ") ||
              r.companyName) ||
          [r.type, r.brand, r.model].filter(Boolean).join(" ") ||
          r.id,
      }));
  function field(
    label: string,
    key: string,
    type = "text",
    required = false,
    choices?: { id: string; label: string }[],
  ) {
    return (
      <label key={key} className="block text-sm font-medium space-y-1">
        <span>
          {label}
          {required ? " *" : ""}
        </span>
        {choices ? (
          <select
            className={base}
            required={required}
            value={form[key] ?? ""}
            onChange={(e) => change(key, e.target.value)}
          >
            <option value="">Select…</option>
            {choices.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea
            className={base}
            rows={4}
            required={required}
            value={form[key] ?? ""}
            onChange={(e) => change(key, e.target.value)}
          />
        ) : (
          <input
            className={base}
            type={type}
            required={required}
            step={type === "number" ? "any" : undefined}
            value={form[key] ?? ""}
            onChange={(e) => change(key, e.target.value)}
          />
        )}
      </label>
    );
  }
  const pick = (label: string, key: string, kind: string, required = false) =>
    field(label, key, "select", required, options(kind));
  const choices = (label: string, key: string, items: string[]) =>
    field(
      label,
      key,
      "select",
      true,
      items.map((id) => ({ id, label: id.replaceAll("_", " ") })),
    );
  const action = (
    row: Row,
    label: string,
    actionName: string,
    extra: Record<string, unknown> = {},
  ) => (
    <button
      key={label}
      className="btn btn-secondary text-sm"
      disabled={busy}
      onClick={() => {
        const reason = [
          "cancel",
          "reject",
          "revoke",
          "remove-timeoff",
        ].includes(actionName)
          ? window.prompt(`${label}: reason`)
          : null;
        if (
          ["cancel", "reject", "remove-timeoff"].includes(actionName) &&
          !reason
        )
          return;
        void send({
          id: row.id,
          version: row.version,
          action: actionName,
          ...extra,
          ...(reason ? { reason, notes: reason, reviewNote: reason } : {}),
        });
      }}
    >
      {label}
    </button>
  );
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const data = { ...form };
    const payload: Record<string, unknown> = {
      ...data,
      ...(selected ? { id: selected.id, version: selected.version } : {}),
    };
    if (definition) {
      const recordData: Record<string, unknown> = {};
      for (const f of definition.fields) {
        let value = data[f.key];
        if (f.type === "datetime-local" && value) value = timestamp(value);
        if (f.type === "number" && value !== "") value = Number(value);
        recordData[f.key] = value;
      }
      Object.assign(payload, {
        title: data.title,
        status: data.status || definition.statuses[0],
        customerId: data.customerId || "",
        jobId: data.jobId || "",
        data: recordData,
      });
    }
    if (module === "bookings") {
      payload.startAt = timestamp(data.startAt);
      payload.endAt = timestamp(data.endAt);
      payload.action = data.action || "save";
    }
    if (module === "timesheets") {
      payload.action = data.action || "start";
      if (data.startTime) payload.startTime = timestamp(data.startTime);
      if (data.endTime) payload.endTime = timestamp(data.endTime);
      payload.type = data.type || "WORK";
    }
    if (module === "purchasing") {
      payload.items = (data.items || []).map((i: Row) => ({
        partId: i.partId,
        quantity: Number(i.quantity),
        unitCost: String(i.unitCost),
      }));
      payload.taxAmount = data.taxAmount || "0";
    }
    if (module === "stock") {
      payload.action = data.action || "transfer";
      payload.quantity = Number(data.quantity);
    }
    if (module === "portal") payload.days = Number(data.days || 7);
    if (module === "communications") {
      payload.scheduledAt = timestamp(data.scheduledAt);
      payload.channel = data.channel || "EMAIL";
    }
    if (module === "integrations") {
      payload.provider = data.provider;
      payload.secret = data.secret || "";
      payload.enabled = data.enabled === true;
      payload.config = Object.fromEntries(
        [
          "from",
          "accountSid",
          "webhookSecret",
          "realmId",
          "environment",
          "incomeAccountId",
        ]
          .filter((k) => data[k])
          .map((k) => [k, data[k]]),
      );
    }
    void send(payload);
  }
  if (!loaded && !error) return <p role="status">Loading operations…</p>;
  return (
    <div className="space-y-5 max-w-6xl">
      <Link href="/dashboard/operations" className="text-primary-700">
        ← Operations
      </Link>
      <h1 className="text-2xl font-bold">{name}</h1>
      <p className="text-gray-600">
        {definition?.description} Company timezone: {lookup?.company.timezone}.
        Date/time inputs use your device timezone.
      </p>
      {error && (
        <div role="alert" className="bg-red-50 text-red-800 p-4 rounded">
          {error}{" "}
          <button
            onClick={() => {
              setError("");
              void load();
            }}
            className="underline"
          >
            Reload
          </button>
        </div>
      )}
      {link && (
        <div className="card p-4">
          <p>Copy this private, expiring access link. It has not been sent.</p>
          <input
            className={base}
            readOnly
            value={link}
            aria-label="Private customer link"
          />
          <button
            className="btn btn-secondary"
            onClick={() => void navigator.clipboard.writeText(link)}
          >
            Copy
          </button>
          <button className="btn btn-secondary" onClick={() => setLink("")}>
            Dismiss
          </button>
        </div>
      )}
      {module === "timesheets" && office && (
        <a
          className="btn btn-secondary"
          href="/api/operations/timesheets?format=csv"
        >
          Export approved time CSV (latest 1,000 entries)
        </a>
      )}
      {module === "communications" && (
        <p className="bg-amber-50 p-3">
          Prepare and review messages here. Send an approved message explicitly after configuring a provider. Queued status does not mean sent.
        </p>
      )}
      {module === "purchasing" && (
        <p>
          Create and approve an internal purchase order, then record quantities
          actually received. Approval does not send an order to a supplier.
          Returns reopen those quantities for replacement.
        </p>
      )}
      {module === "integrations" && (
        <p>
          Credentials are encrypted on the server and never returned. Configure
          only the provider you use. Live provider acceptance remains a separate
          check.
        </p>
      )}
      {module === "workforce" ? (
        <Workforce
          rows={rows}
          lookup={lookup}
          manager={!!manager}
          busy={busy}
          send={send}
        />
      ) : (
        module !== "reviews" && (
          <form onSubmit={submit} className="card p-5 space-y-4">
            <h2 className="font-semibold">
              {selected ? "Edit selected record" : "New record"}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {definition && (
                <>
                  {field("Title", "title", "text", true)}
                  {choices("Status", "status", definition.statuses)}
                  {pick(
                    "Customer",
                    "customerId",
                    "customers",
                    module === "maintenance",
                  )}
                  {pick("Related job", "jobId", "jobs")}
                  {definition.fields.map((f: Field) =>
                    f.options
                      ? choices(f.label, f.key, f.options)
                      : [
                            "properties",
                            "equipment",
                            "serviceTypes",
                            "vendors",
                          ].includes(f.type)
                        ? pick(f.label, f.key, f.type, !!f.required)
                        : field(
                            f.label,
                            f.key,
                            f.type === "money" ? "text" : f.type,
                            !!f.required,
                          ),
                  )}
                </>
              )}
              {module === "bookings" && (
                <>
                  {pick("Customer", "customerId", "customers", true)}
                  {pick("Property", "propertyId", "properties")}
                  {pick("Service type", "serviceTypeId", "serviceTypes", true)}
                  {pick(
                    "Technician (required for confirmation)",
                    "technicianId",
                    "technicians",
                  )}
                  {field("Title", "title", "text", true)}
                  {field("Start", "startAt", "datetime-local", true)}
                  {field("End", "endAt", "datetime-local", true)}
                  {field("Notes", "notes", "textarea")}
                  {choices("Save as", "action", ["save", "confirm"])}
                </>
              )}
              {module === "timesheets" && (
                <>
                  {choices(
                    "Action",
                    "action",
                    selected ? ["correct"] : ["start", "manual"],
                  )}
                  {pick("Job", "jobId", "jobs", !selected)}
                  {office &&
                    pick(
                      "Technician",
                      "technicianId",
                      "technicians",
                      !selected,
                    )}
                  {choices("Time type", "type", ["WORK", "TRAVEL", "BREAK"])}
                  {(form.action === "manual" || selected) && (
                    <>
                      {field("Start", "startTime", "datetime-local", true)}
                      {field("End", "endTime", "datetime-local", true)}
                    </>
                  )}
                  {field("Notes", "notes", "textarea")}
                  {selected &&
                    field("Correction reason", "reason", "textarea", true)}
                </>
              )}
              {module === "purchasing" && (
                <>
                  {pick("Active vendor", "vendorId", "vendors", true)}
                  {field("Tax amount", "taxAmount", "text")}
                  {field("Order notes", "notes", "textarea")}
                </>
              )}
              {module === "stock" && (
                <>
                  {choices(
                    "Action",
                    "action",
                    manager ? ["transfer", "adjust"] : ["transfer"],
                  )}
                  {pick("Part", "partId", "parts", true)}
                  {(form.action || "transfer") === "transfer" ? (
                    <>
                      {pick(
                        "From (blank = warehouse)",
                        "fromTruckId",
                        "trucks",
                      )}
                      {pick("To (blank = warehouse)", "toTruckId", "trucks")}
                    </>
                  ) : (
                    <>
                      {pick(
                        "Location (blank = warehouse)",
                        "truckId",
                        "trucks",
                      )}
                      {field("Adjustment reason", "reason", "textarea", true)}
                    </>
                  )}
                  {field(
                    "Quantity (negative for removal in adjustments)",
                    "quantity",
                    "number",
                    true,
                  )}
                </>
              )}
              {module === "portal" && (
                <>
                  {pick("Customer", "customerId", "customers", true)}
                  {field("Link expires in days (1–30)", "days", "number")}
                </>
              )}
              {module === "communications" && (
                <>
                  {pick("Customer", "customerId", "customers", true)}
                  {pick("Related job", "jobId", "jobs")}
                  {choices("Channel", "channel", ["EMAIL", "SMS"])}
                  {field("Subject", "subject")}
                  {field("Message", "body", "textarea", true)}
                  <label>
                    <input
                      type="checkbox"
                      checked={form.contactAuthorized === true}
                      onChange={(e) =>
                        change("contactAuthorized", e.target.checked)
                      }
                    />{" "}
                    I am authorized to contact this customer about this service.
                  </label>
                  {field(
                    "Scheduled time",
                    "scheduledAt",
                    "datetime-local",
                    true,
                  )}
                </>
              )}
              {module === "integrations" && (
                <>
                  {choices("Provider", "provider", [
                    "stripe",
                    "resend",
                    "twilio",
                  ])}
                  {field(
                    "API credential (leave blank to retain)",
                    "secret",
                    "password",
                  )}
                  {form.provider === "stripe"
                    ? field(
                        "Webhook signing secret",
                        "webhookSecret",
                        "password",
                      )
                    : field("Sender address / number", "from", "text", true)}
                  {form.provider === "resend" &&
                    field(
                      "Webhook signing secret",
                      "webhookSecret",
                      "password",
                    )}
                  {form.provider === "twilio" &&
                    field("Account SID", "accountSid", "text", true)}
                  <label>
                    <input
                      type="checkbox"
                      checked={form.enabled === true}
                      onChange={(e) => change("enabled", e.target.checked)}
                    />{" "}
                    Enable this connection
                  </label>
                </>
              )}
            </div>
            {module === "purchasing" && (
              <div className="space-y-3">
                <h3 className="font-medium">Order lines</h3>
                {(form.items || []).map((line: Row, index: number) => (
                  <div className="grid md:grid-cols-4 gap-2" key={index}>
                    <label>
                      Part
                      <select
                        className={base}
                        required
                        value={line.partId || ""}
                        onChange={(e) => {
                          const items = [...form.items];
                          items[index] = {
                            ...line,
                            partId: e.target.value,
                            unitCost:
                              lookup?.parts.find(
                                (p: Row) => p.id === e.target.value,
                              )?.cost || "0",
                          };
                          change("items", items);
                        }}
                      >
                        <option value="">Select part</option>
                        {options("parts").map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Quantity
                      <input
                        className={base}
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={line.quantity || ""}
                        onChange={(e) => {
                          const items = [...form.items];
                          items[index] = { ...line, quantity: e.target.value };
                          change("items", items);
                        }}
                      />
                    </label>
                    <label>
                      Unit cost
                      <input
                        className={base}
                        required
                        value={line.unitCost ?? ""}
                        onChange={(e) => {
                          const items = [...form.items];
                          items[index] = { ...line, unitCost: e.target.value };
                          change("items", items);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        change(
                          "items",
                          form.items.filter(
                            (_: unknown, i: number) => i !== index,
                          ),
                        )
                      }
                    >
                      Remove line
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    change("items", [
                      ...(form.items || []),
                      { partId: "", quantity: 1, unitCost: "0" },
                    ])
                  }
                >
                  Add line
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button disabled={busy} className="btn btn-primary">
                {busy
                  ? "Saving…"
                  : module === "portal"
                    ? "Create private link"
                    : "Save"}
              </button>
              {selected && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelected(null);
                    setForm({});
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        )
      )}
      <label className="block">
        Search saved records
        <input
          className={base}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div className="space-y-3">
        {(Array.isArray(rows) ? rows : [])
          .filter((r) =>
            [
              r.title,
              r.poNumber,
              r.job?.jobNumber,
              r.status,
              r.provider,
              r.customerId,
              r.kind,
            ]
              .join(" ")
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
          .map((row) => (
            <article className="card p-4 space-y-2" key={row.id}>
              <h2 className="font-semibold">
                {row.title ||
                  row.poNumber ||
                  row.job?.jobNumber ||
                  row.provider ||
                  row.kind ||
                  row.customerId ||
                  row.id}{" "}
                <span className="text-sm font-normal text-gray-500">
                  {row.status || row.approvalStatus || ""}
                </span>
              </h2>
              {row.startAt && (
                <p>
                  {new Date(row.startAt).toLocaleString()} –{" "}
                  {new Date(row.endAt).toLocaleString()}
                </p>
              )}
              {row.startTime && (
                <p>
                  {row.technician?.user.firstName}{" "}
                  {row.technician?.user.lastName} · {row.type} ·{" "}
                  {new Date(row.startTime).toLocaleString()} →{" "}
                  {row.endTime
                    ? new Date(row.endTime).toLocaleString()
                    : "Timer running"}{" "}
                  · {row.duration ?? "—"} minutes
                </p>
              )}
              {row.notes && <p className="whitespace-pre-wrap">{row.notes}</p>}
              {row.body && (
                <p className="whitespace-pre-wrap">
                  {row.subject}
                  <br />
                  {row.body}
                </p>
              )}
              {row.reviewNote && <p>Review: {row.reviewNote}</p>}
              {row.lastError && <p role="alert">{row.lastError}</p>}
              {definition && (
                <dl className="grid md:grid-cols-2 gap-2">
                  {definition.fields.map((f) => (
                    <div key={f.key}>
                      <dt className="text-xs text-gray-500">{f.label}</dt>
                      <dd className="whitespace-pre-wrap break-words">
                        {String(row.data?.[f.key] ?? "—")}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {module === "purchasing" && (
                <>
                  <p>
                    {row.vendorName} · Subtotal {row.subtotal} · Tax{" "}
                    {row.taxAmount} · Total {row.totalAmount}
                  </p>
                  {row.items.map((item: Row) => (
                    <div className="border-t pt-2" key={item.id}>
                      <p>
                        {item.part.name}: {item.receivedQty} / {item.quantity}{" "}
                        received · unit cost {item.unitCost}
                      </p>
                      {["ORDERED", "PARTIAL"].includes(row.status) &&
                        item.receivedQty < item.quantity && (
                          <button
                            className="btn btn-secondary"
                            disabled={busy}
                            onClick={() => {
                              const quantity = Number(
                                window.prompt(
                                  `Quantity actually received (maximum ${item.quantity - item.receivedQty})`,
                                ),
                              );
                              if (quantity > 0)
                                void send({
                                  id: row.id,
                                  version: row.version,
                                  action: "receive",
                                  receipts: [{ itemId: item.id, quantity }],
                                });
                            }}
                          >
                            Receive
                          </button>
                        )}
                      {manager && item.receivedQty > 0 && (
                        <button
                          className="btn btn-secondary"
                          disabled={busy}
                          onClick={() => {
                            const quantity = Number(
                                window.prompt(
                                  "Quantity physically returned from the warehouse",
                                ),
                              ),
                              reason =
                                quantity > 0
                                  ? window.prompt("Return reason")
                                  : null;
                            if (quantity > 0 && reason)
                              void send({
                                id: row.id,
                                version: row.version,
                                action: "return",
                                itemId: item.id,
                                quantity,
                                reason,
                              });
                          }}
                        >
                          Return
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}
              {module === "stock" && (
                <p>
                  {lookup?.parts.find((p: Row) => p.id === row.partId)?.name ||
                    row.partId}{" "}
                  · {row.quantity > 0 ? "+" : ""}
                  {row.quantity} · {row.sourceId} ·{" "}
                  {new Date(row.createdAt).toLocaleString()}
                </p>
              )}
              {module === "reviews" && (
                <p>
                  {row.rating}/5 · {row.comment} ·{" "}
                  {new Date(row.createdAt).toLocaleString()}
                </p>
              )}
              {module === "portal" && (
                <p>
                  Expires {new Date(row.expiresAt).toLocaleString()} ·{" "}
                  {row.revokedAt ? "Revoked" : "Active until expiry"}
                </p>
              )}
              {module === "integrations" && (
                <p>
                  {row.enabled ? "Enabled" : "Disabled"} · Credentials stored ·
                  Updated {new Date(row.updatedAt).toLocaleString()}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {(definition ||
                  (module === "bookings" &&
                    !["CANCELLED", "COMPLETED"].includes(row.status)) ||
                  (module === "purchasing" && row.status === "DRAFT") ||
                  (module === "communications" && row.status === "DRAFT") ||
                  module === "integrations") && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      edit(row);
                      if (module === "integrations")
                        setForm({ ...row, ...row.config, secret: "" });
                    }}
                  >
                    Edit
                  </button>
                )}
                {row.jobId && (
                  <Link
                    className="btn btn-secondary"
                    href={`/dashboard/jobs/${row.jobId}`}
                  >
                    Open job
                  </Link>
                )}
                {module === "leads" &&
                  !row.customerId &&
                  action(row, "Convert to customer", "convert")}
                {module === "maintenance" &&
                  row.status === "ACTIVE" &&
                  action(row, "Create next visit", "visit")}
                {module === "bookings" &&
                  ["REQUESTED", "CONFIRMED"].includes(row.status) &&
                  action(row, "Cancel booking", "cancel")}
                {module === "timesheets" && (
                  <>
                    {!row.endTime && action(row, "Stop timer", "stop")}
                    {office &&
                      row.endTime &&
                      row.approvalStatus !== "APPROVED" && (
                        <>
                          {action(row, "Approve time", "approve")}
                          {action(row, "Reject time", "reject")}
                        </>
                      )}
                    {office && row.approvalStatus !== "APPROVED" && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          edit(row);
                          setForm({
                            ...row,
                            startTime: local(row.startTime),
                            endTime: local(row.endTime),
                            action: "correct",
                          });
                        }}
                      >
                        Correct time
                      </button>
                    )}
                  </>
                )}
                {module === "purchasing" && (
                  <>
                    {manager &&
                      row.status === "DRAFT" &&
                      action(row, "Approve order", "approve")}
                    {["DRAFT", "ORDERED"].includes(row.status) &&
                      action(row, "Cancel order", "cancel")}
                  </>
                )}
                {module === "communications" && (
                  <>
                    {row.status === "QUEUED" && (
                      <button
                        className="btn btn-primary"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Send this approved message to the customer now?",
                            )
                          )
                            void send({ action: "dispatch", id: row.id });
                        }}
                      >
                        Send approved message
                      </button>
                    )}
                    {row.providerId &&
                      action(row, "Refresh provider status", "refresh")}

                    {["DRAFT", "REJECTED"].includes(row.status) &&
                      action(row, "Approve queue", "approve")}
                    {["DRAFT", "QUEUED", "REJECTED"].includes(row.status) &&
                      action(row, "Cancel message", "cancel")}
                  </>
                )}
                {module === "portal" &&
                  !row.revokedAt &&
                  action(row, "Revoke link", "revoke")}
              </div>
            </article>
          ))}
        {loaded && !rows.length && (
          <p className="text-gray-500">No records yet.</p>
        )}
      </div>
    </div>
  );
}
function Workforce({
  rows,
  lookup,
  manager,
  busy,
  send,
}: {
  rows: Row[];
  lookup: Lookups | null;
  manager: boolean;
  busy: boolean;
  send: (body: Record<string, unknown>) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState<Row | null>(null),
    [hours, setHours] = useState<Row[]>([]),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [reason, setReason] = useState("");
  return (
    <div className="card p-5 space-y-4">
      <label>
        Technician
        <select
          className={base}
          value={selected?.id || ""}
          onChange={(e) => {
            const r = rows.find((r) => r.id === e.target.value) || null;
            setSelected(r);
            setHours(
              Array.from({ length: 7 }, (_, i) => ({
                ...r?.schedules.find((s: Row) => s.dayOfWeek === i),
                id: String(i),
                dayOfWeek: i,
                startTime:
                  r?.schedules.find((s: Row) => s.dayOfWeek === i)?.startTime ||
                  "08:00",
                endTime:
                  r?.schedules.find((s: Row) => s.dayOfWeek === i)?.endTime ||
                  "17:00",
                isWorking:
                  r?.schedules.find((s: Row) => s.dayOfWeek === i)?.isWorking ||
                  false,
              })),
            );
          }}
        >
          <option value="">Select…</option>
          {rows.map((r) => (
            <option key={r.id} value={r.id}>
              {r.user.firstName} {r.user.lastName}
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <>
          <p>Working hours use the company timezone.</p>
          {hours.map((h, index) => (
            <div className="flex gap-3 items-center" key={index}>
              <label className="w-28">
                <input
                  type="checkbox"
                  disabled={!manager}
                  checked={h.isWorking}
                  onChange={(e) =>
                    setHours(
                      hours.map((r, i) =>
                        i === index ? { ...r, isWorking: e.target.checked } : r,
                      ),
                    )
                  }
                />{" "}
                {
                  [
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ][index]
                }
              </label>
              {["startTime", "endTime"].map((k) => (
                <input
                  aria-label={`${k} ${index}`}
                  key={k}
                  type="time"
                  className="input"
                  disabled={!manager}
                  value={h[k]}
                  onChange={(e) =>
                    setHours(
                      hours.map((r, i) =>
                        i === index ? { ...r, [k]: e.target.value } : r,
                      ),
                    )
                  }
                />
              ))}
            </div>
          ))}
          {manager && (
            <>
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={async () => {
                  if (
                    await send({
                      action: "hours",
                      technicianId: selected.id,
                      updatedAt: selected.updatedAt,
                      schedules: hours.map(({ id, ...h }) => ({
                        dayOfWeek: h.dayOfWeek,
                        startTime: h.startTime,
                        endTime: h.endTime,
                        isWorking: h.isWorking,
                      })),
                    })
                  )
                    setSelected(null);
                }}
              >
                Save working hours
              </button>
              <form
                className="space-y-3 border-t pt-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    await send({
                      action: "timeoff",
                      technicianId: selected.id,
                      startAt: timestamp(start),
                      endAt: timestamp(end),
                      reason,
                    })
                  ) {
                    setStart("");
                    setEnd("");
                    setReason("");
                  }
                }}
              >
                <h3 className="font-semibold">Add time off</h3>
                <label>
                  Start (device timezone)
                  <input
                    className={base}
                    type="datetime-local"
                    required
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </label>
                <label>
                  End
                  <input
                    className={base}
                    type="datetime-local"
                    required
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </label>
                <label>
                  Reason
                  <input
                    className={base}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <button className="btn btn-secondary" disabled={busy}>
                  Add time off
                </button>
              </form>
            </>
          )}
          {(lookup?.timeOff || [])
            .filter((r: Row) => r.technicianId === selected.id)
            .map((r: Row) => (
              <div key={r.id}>
                {new Date(r.startAt).toLocaleString()} –{" "}
                {new Date(r.endAt).toLocaleString()}: {r.reason}{" "}
                {manager && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      const reason = window.prompt(
                        "Reason for removing time off",
                      );
                      if (reason)
                        void send({
                          action: "remove-timeoff",
                          technicianId: selected.id,
                          id: r.id,
                          reason,
                        });
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
        </>
      )}
    </div>
  );
}
