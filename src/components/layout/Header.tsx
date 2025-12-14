'use client'

import { useSession } from 'next-auth/react'
import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface HeaderProps {
  title?: string
}

export default function Header({ title }: HeaderProps) {
  const { data: session } = useSession()
  const [showSearch, setShowSearch] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {title && (
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            {showSearch ? (
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Search..."
                  className="input w-64"
                  autoFocus
                  onBlur={() => setShowSearch(false)}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <BellIcon className="w-5 h-5 text-gray-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-medium text-sm">
                {session?.user?.name?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
