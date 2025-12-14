'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  HomeIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CubeIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  TruckIcon,
  MapIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Customers', href: '/dashboard/customers', icon: UsersIcon },
  { name: 'Jobs', href: '/dashboard/jobs', icon: WrenchScrewdriverIcon },
  { name: 'Dispatch', href: '/dashboard/dispatch', icon: MapIcon },
  { name: 'Schedule', href: '/dashboard/schedule', icon: CalendarDaysIcon },
  { name: 'Estimates', href: '/dashboard/estimates', icon: DocumentTextIcon },
  { name: 'Invoices', href: '/dashboard/invoices', icon: CurrencyDollarIcon },
  { name: 'Inventory', href: '/dashboard/inventory', icon: CubeIcon },
  { name: 'Agreements', href: '/dashboard/agreements', icon: ClipboardDocumentCheckIcon },
  { name: 'Technicians', href: '/dashboard/technicians', icon: TruckIcon },
  { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon },
  { name: 'AI Features', href: '/dashboard/ai', icon: SparklesIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
]

const techNavigation = [
  { name: "Today's Jobs", href: '/tech', icon: WrenchScrewdriverIcon },
  { name: 'Truck Inventory', href: '/tech/inventory', icon: CubeIcon },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const isTechnician = session?.user?.role === 'TECHNICIAN'
  const navItems = isTechnician ? techNavigation : navigation

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Bars3Icon className="w-6 h-6 text-gray-600" />
      </button>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <WrenchScrewdriverIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">HomeServ AI</span>
            </Link>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Technician Mobile Link */}
          {!isTechnician && (
            <div className="px-4 py-2 border-t border-gray-200">
              <Link
                href="/tech"
                className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                <DevicePhoneMobileIcon className="w-5 h-5" />
                <span>Technician App</span>
              </Link>
            </div>
          )}

          {/* User info */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-medium">
                  {session?.user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.role || 'Staff'}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
