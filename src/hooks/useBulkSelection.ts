'use client'

import { useState, useCallback } from 'react'

export function useBulkSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const allSelected = ids.every(id => prev.has(id))
      if (allSelected) {
        return new Set()
      }
      return new Set(ids)
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds])

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
  }
}
