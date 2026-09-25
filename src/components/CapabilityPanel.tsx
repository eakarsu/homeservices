'use client';
/**
 * Capability panel — shared shell for the batch10 capability pages.
 *
 * These pages previously rendered a free-text prompt box and posted it to a
 * generic `/api/cf-<slug>` model endpoint. That made the page look like the
 * feature was missing when the real capability already existed behind a
 * domain API. Each page now declares its real endpoint and renders the actual
 * response shape.
 */
import { useCallback, useEffect, useState } from 'react';

export interface CapabilityField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}

export interface CapabilityPanelProps {
  title: string;
  description: string;
  /** Real domain endpoint, e.g. "/api/fieldops". */
  endpoint: string;
  method?: 'GET' | 'POST';
  /** Query string appended for GET requests. */
  query?: string;
  fields?: CapabilityField[];
  /** Extra key/values merged into the POST body. */
  bodyDefaults?: Record<string, unknown>;
  /** Human note about what the computation does / does not claim. */
  assumptions?: string[];
  render?: (data: any) => React.ReactNode;
}

export default function CapabilityPanel({
  title,
  description,
  endpoint,
  method = 'POST',
  query = '',
  fields = [],
  bodyDefaults = {},
  assumptions = [],
  render,
}: CapabilityPanelProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of fields) init[f.name] = f.defaultValue ?? '';
    return init;
  });
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const missing = fields.filter((f) => f.required && !String(values[f.name] ?? '').trim());
      if (missing.length) {
        setError(`Required: ${missing.map((m) => m.label).join(', ')}`);
        return;
      }
      const body: Record<string, unknown> = { ...bodyDefaults };
      for (const f of fields) {
        const raw = values[f.name];
        if (raw === '' || raw == null) continue;
        body[f.name] = f.type === 'number' ? Number(raw) : raw;
      }
      const res = await fetch(
        endpoint + (method === 'GET' ? (query ? `?${query}` : '') : ''),
        method === 'GET'
          ? { credentials: 'include' }
          : {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(body),
            },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Request failed');
    } finally {
      setBusy(false);
    }
  }, [values, endpoint, method, query, fields, bodyDefaults]);

  // GET panels load immediately.
  useEffect(() => {
    if (method === 'GET') void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>{title}</h1>
      <p style={{ opacity: 0.75, marginBottom: 16 }}>{description}</p>

      {fields.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          {fields.map((f) => (
            <label key={f.name} style={{ display: 'block', fontSize: 13 }}>
              <span style={{ display: 'block', marginBottom: 4, opacity: 0.8 }}>
                {f.label}
                {f.required ? ' *' : ''}
              </span>
              {f.type === 'select' ? (
                <select
                  value={values[f.name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  style={{ width: '100%', padding: 8 }}
                >
                  <option value="">—</option>
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                  value={values[f.name] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  style={{ width: '100%', padding: 8 }}
                />
              )}
            </label>
          ))}
        </div>
      )}

      <button
        onClick={() => void run()}
        disabled={busy}
        style={{ padding: '10px 18px', cursor: busy ? 'wait' : 'pointer' }}
      >
        {busy ? 'Working…' : method === 'GET' ? 'Refresh' : 'Run'}
      </button>

      {error && (
        <div style={{ marginTop: 16, padding: 12, background: '#fde8e8', color: '#8a1c1c' }}>
          {error}
        </div>
      )}

      {data && (
        <div style={{ marginTop: 20 }}>
          {render ? render(data) : <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>}
        </div>
      )}

      {(assumptions.length > 0 || data?.assumptions) && (
        <div style={{ marginTop: 24, fontSize: 12, opacity: 0.7 }}>
          <strong>What this does and does not claim</strong>
          <ul>
            {[...assumptions, ...((data?.assumptions as string[]) ?? [])].map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
