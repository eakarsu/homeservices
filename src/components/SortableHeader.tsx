'use client'

import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

interface SortableHeaderProps {
  label: string
  field: string
  currentSort: string
  currentDirection: 'asc' | 'desc'
  onSort: (field: string) => void
  className?: string
}

export default function SortableHeader({
  label,
  field,
  currentSort,
  currentDirection,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = currentSort === field

  return (
    <th
      className={`table-header cursor-pointer select-none hover:bg-gray-100 ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <span className="flex flex-col">
          <ChevronUpIcon
            className={`w-3 h-3 -mb-1 ${isActive && currentDirection === 'asc' ? 'text-primary-600' : 'text-gray-300'}`}
          />
          <ChevronDownIcon
            className={`w-3 h-3 ${isActive && currentDirection === 'desc' ? 'text-primary-600' : 'text-gray-300'}`}
          />
        </span>
      </div>
    </th>
  )
}
