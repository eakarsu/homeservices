'use client'
import { useEffect, useState } from 'react'
export default function IntegrationReadiness() {
  const [data, setData] = useState<any>(null), [result, setResult] = useState<any>(null), [busy, setBusy] = useState(false)
  async function load() { const r = await fetch('/api/operations/integration-readiness'); if (r.ok) setData(await r.json()) }
  useEffect(() => { void load() }, [])
  async function check(provider: string) {
    setBusy(true)
    try { const r = await fetch('/api/operations/integration-readiness', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider }) }); setResult(await r.json()); await load() }
    catch { setResult({ error: 'Unable to check connection' }) } finally { setBusy(false) }
  }
  if (!data) return null
  return <section className="card p-5 space-y-4"><h2 className="font-semibold">Stripe & Twilio setup</h2>
    {!data.encryptionReady && <p role="alert">The server needs an integration encryption key before credentials can be saved.</p>}
    <p>Save your credentials below, then check the connection. Checks do not charge customers or send messages.</p>
    <div className="flex flex-wrap gap-3">{['stripe','twilio','smtp'].map(p => <button type="button" className="btn btn-secondary" key={p} disabled={busy} onClick={() => void check(p)}>Check {p === 'smtp' ? 'account email' : p}</button>)}</div>
    {result && <pre role="status" className="bg-gray-50 p-3 whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>}
    <p>Account email: {data.email.configured ? `${data.email.transport} configured` : 'Needs SMTP sender, username and password on the server'}.</p>
    <p>In Stripe, add a webhook endpoint for Checkout and refund events. In Twilio, set the number’s incoming SMS and voice webhooks to these URLs using POST:</p>
    <dl className="space-y-2 text-sm">{Object.entries(data.callbacks).map(([name,url]) => <div key={name}><dt className="font-medium">{name}</dt><dd className="break-all select-all">{String(url)}</dd></div>)}</dl>
    <p className="text-sm">Software subscriptions use separate server billing settings and recurring Stripe prices. Customer invoice payments use this company’s Stripe connection.</p>
  </section>
}
