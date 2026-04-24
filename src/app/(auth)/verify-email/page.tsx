'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { WrenchScrewdriverIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'check-email'>('check-email')
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (token && email) {
      verifyEmail()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email])

  const verifyEmail = async () => {
    setStatus('verifying')
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
      setStatus('error')
    }
  }

  const resendVerification = async () => {
    if (!email) return
    setResending(true)
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setError('')
      setStatus('check-email')
    } catch {
      // ignore
    } finally {
      setResending(false)
    }
  }

  if (status === 'verifying') {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Verifying your email...</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Email verified</h3>
        <p className="text-gray-600 mb-6">Your email has been verified successfully. You can now sign in.</p>
        <Link href="/login" className="btn-primary inline-block">
          Sign in
        </Link>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center py-8">
        <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification failed</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        {email && (
          <button
            onClick={resendVerification}
            disabled={resending}
            className="btn-primary"
          >
            {resending ? 'Sending...' : 'Resend verification email'}
          </button>
        )}
      </div>
    )
  }

  // check-email state
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h3>
      <p className="text-gray-600 mb-6">
        We sent a verification link to your email address. Click the link to verify your account.
      </p>
      <Link href="/login" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
        Back to sign in
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center">
            <WrenchScrewdriverIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Email Verification</h2>
        </div>
        <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  )
}
