'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type EstimateOption = {
  id: string
  name: string
  description?: string | null
  totalAmount: string | number
  lineItems: Array<{ description: string; quantity: string | number; unitPrice: string | number; totalPrice: string | number }>
}

type ApprovalView = {
  estimateNumber: string
  expirationDate?: string | null
  jurisdiction: string
  templateSource: string
  customerName: string
  options: EstimateOption[]
  attestation: string
}

export default function EstimateApprovalPage() {
  const { token } = useParams<{ token: string }>()
  const [estimate, setEstimate] = useState<ApprovalView | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState('')
  const [signerName, setSignerName] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState('Loading reviewed estimate…')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/estimates/approve/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load estimate')
        return data as ApprovalView
      })
      .then(data => {
        setEstimate(data)
        setSelectedOptionId(data.options[0]?.id || '')
        setStatus('')
      })
      .catch(error => setStatus(error instanceof Error ? error.message : 'Unable to load estimate'))
  }, [token])

  async function approve() {
    if (!estimate || !selectedOptionId || !signerName.trim() || !consent) return
    setSubmitting(true)
    setStatus('Submitting approval…')
    try {
      const response = await fetch(`/api/estimates/approve/${encodeURIComponent(token)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedOptionId, signerName: signerName.trim(), signature: `/s/ ${signerName.trim()}`,
          consent: true, attestation: estimate.attestation,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Approval failed')
      setEstimate(null)
      setStatus(`Estimate ${data.estimateNumber} was approved successfully.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Approval failed')
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-white px-6 py-12 text-gray-900">
      <h1 className="text-3xl font-bold">Estimate review and approval</h1>
      {status && <p role="status" className="mt-6 rounded-lg bg-gray-100 p-4">{status}</p>}
      {estimate && (
        <div className="mt-8 space-y-6">
          <div className="rounded-lg border p-5">
            <p className="font-semibold">Estimate {estimate.estimateNumber}</p>
            <p>Prepared for {estimate.customerName}</p>
            <p>Jurisdiction: {estimate.jurisdiction}</p>
            <p>Template source: <a className="underline" href={estimate.templateSource} rel="noreferrer" target="_blank">view authoritative source</a></p>
          </div>
          <fieldset className="space-y-4">
            <legend className="text-xl font-semibold">Choose one option</legend>
            {estimate.options.map(option => (
              <label key={option.id} className="block cursor-pointer rounded-lg border p-5">
                <input type="radio" name="option" value={option.id} checked={selectedOptionId === option.id} onChange={() => setSelectedOptionId(option.id)} />
                <span className="ml-3 font-semibold">{option.name} — ${Number(option.totalAmount).toFixed(2)}</span>
                {option.description && <p className="mt-2 text-gray-600">{option.description}</p>}
                <ul className="mt-3 list-disc pl-6 text-sm">
                  {option.lineItems.map((line, index) => <li key={`${option.id}-${index}`}>{line.description}: {Number(line.quantity)} × ${Number(line.unitPrice).toFixed(2)} = ${Number(line.totalPrice).toFixed(2)}</li>)}
                </ul>
              </label>
            ))}
          </fieldset>
          <label className="block font-medium">Legal name for electronic signature
            <input className="mt-2 w-full rounded border p-3" maxLength={200} value={signerName} onChange={event => setSignerName(event.target.value)} autoComplete="name" />
          </label>
          <label className="flex items-start gap-3 rounded-lg border p-4">
            <input className="mt-1" type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} />
            <span>{estimate.attestation}</span>
          </label>
          <button className="rounded bg-orange-600 px-5 py-3 font-semibold text-white disabled:opacity-50" disabled={submitting || !consent || !signerName.trim() || !selectedOptionId} onClick={approve}>
            Approve and sign electronically
          </button>
        </div>
      )}
    </main>
  )
}
