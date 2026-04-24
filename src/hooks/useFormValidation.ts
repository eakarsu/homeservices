'use client'

import { useState, useCallback } from 'react'
import { validateField, validateAllFields, type FieldRules } from '@/lib/validation'

export function useFormValidation(fieldRules: FieldRules) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const markTouched = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const validateOne = useCallback((field: string, value: string) => {
    const rules = fieldRules[field]
    if (!rules) return
    const error = validateField(value, rules)
    setErrors(prev => {
      const next = { ...prev }
      if (error) {
        next[field] = error
      } else {
        delete next[field]
      }
      return next
    })
  }, [fieldRules])

  const validateAll = useCallback((values: Record<string, string>): boolean => {
    const allErrors = validateAllFields(values, fieldRules)
    setErrors(allErrors)
    const allTouched: Record<string, boolean> = {}
    for (const field of Object.keys(fieldRules)) {
      allTouched[field] = true
    }
    setTouched(allTouched)
    return Object.keys(allErrors).length === 0
  }, [fieldRules])

  const clearErrors = useCallback(() => {
    setErrors({})
    setTouched({})
  }, [])

  return {
    errors,
    touched,
    markTouched,
    validateOne,
    validateAll,
    clearErrors,
  }
}
