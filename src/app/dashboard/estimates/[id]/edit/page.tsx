'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { responseErrorMessage } from '@/lib/api-error'
import toast from 'react-hot-toast'

interface Estimate {
  id: string
  estimateNumber: string
  status: string
  notes?: string | null
  terms?: string | null
}

export default function EditEstimatePage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const estimateId = params.id as string
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('')
  const [loaded, setLoaded] = useState(false)

  const { data: estimate, isLoading } = useQuery<Estimate>({
    queryKey: ['estimate', estimateId],
    queryFn: async () => {
      const res = await fetch(`/api/estimates/${estimateId}`)
      if (!res.ok) throw new Error(await responseErrorMessage(res, 'Failed to fetch estimate'))
      return res.json()
    },
  })

  useEffect(() => {
    if (estimate && !loaded) {
      setNotes(estimate.notes || '')
      setTerms(estimate.terms || '')
      setLoaded(true)
    }
  }, [estimate, loaded])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, terms }),
      })
      if (!res.ok) throw new Error(await responseErrorMessage(res, 'Failed to save draft'))
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] })
      toast.success('Draft notes and terms updated')
      router.push(`/dashboard/estimates/${estimateId}`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save draft')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Estimate not found</p>
        <Link href="/dashboard/estimates" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to estimates
        </Link>
      </div>
    )
  }

  if (estimate.status !== 'DRAFT') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/estimates/${estimateId}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit {estimate.estimateNumber}</h1>
        </div>
        <div className="card">
          <p className="text-gray-700">
            Reviewed or delivered estimate versions are immutable. Only drafts can be edited;
            reopen the estimate to review its recorded version history.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/estimates/${estimateId}`} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit {estimate.estimateNumber}</h1>
          <p className="text-sm text-gray-500">Draft notes and terms can be edited; priced options use the quote workflow.</p>
        </div>
      </div>

      <div className="card space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Notes</span>
          <textarea
            className="input mt-1"
            rows={5}
            maxLength={5000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Terms &amp; Conditions</span>
          <textarea
            className="input mt-1"
            rows={8}
            maxLength={10000}
            value={terms}
            onChange={(event) => setTerms(event.target.value)}
          />
        </label>
        <div className="flex justify-end gap-2">
          <Link href={`/dashboard/estimates/${estimateId}`} className="btn-secondary">Cancel</Link>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Draft'}
          </button>
        </div>
      </div>
    </div>
  )
}
