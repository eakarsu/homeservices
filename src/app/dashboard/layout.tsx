'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import LogoutButton from '@/components/LogoutButton'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:pl-64">
        <header aria-label="Account controls" className="sticky top-0 z-30 flex items-center justify-end gap-4 border-b border-gray-200 bg-white px-6 py-3">
          <Link href="/" className="text-sm font-medium text-gray-700 hover:text-primary-600">View website</Link>
          <LogoutButton />
        </header>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
