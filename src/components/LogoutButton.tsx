'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'

export default function LogoutButton() {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  return <div>
    <button type="button" disabled={pending} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-50" onClick={async () => {
      setPending(true); setFailed(false)
      try { await signOut({ callbackUrl: '/' }) }
      catch { setFailed(true); setPending(false) }
    }}>{pending ? 'Logging out…' : 'Log Out'}</button>
    {failed && <p role="alert" className="text-sm text-red-700">Could not log out. Please try again.</p>}
  </div>
}
