'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
  CubeIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'

const navItems = [
  { name: 'Home', href: '/tech', icon: HomeIcon },
  { name: 'Jobs', href: '/tech/job', icon: WrenchScrewdriverIcon },
  { name: 'Schedule', href: '/tech/schedule', icon: CalendarDaysIcon },
  { name: 'Inventory', href: '/tech/inventory', icon: CubeIcon },
  { name: 'Profile', href: '/tech/profile', icon: UserCircleIcon },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/tech' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
