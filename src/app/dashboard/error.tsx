'use client'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button onClick={reset} className="btn-primary">
        Try again
      </button>
    </div>
  )
}
