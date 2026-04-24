export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'email' | 'phone' | 'zip' | 'match' | 'custom'
  value?: number | string
  message: string
  validate?: (value: string) => boolean
}

export interface FieldRules {
  [field: string]: ValidationRule[]
}

export function validateField(value: string, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || !value.trim()) return rule.message
        break
      case 'minLength':
        if (value && value.length < (rule.value as number)) return rule.message
        break
      case 'maxLength':
        if (value && value.length > (rule.value as number)) return rule.message
        break
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return rule.message
        break
      case 'phone':
        if (value && !/^[\d\s()+-]{7,}$/.test(value)) return rule.message
        break
      case 'zip':
        if (value && !/^\d{5}(-\d{4})?$/.test(value)) return rule.message
        break
      case 'custom':
        if (rule.validate && !rule.validate(value)) return rule.message
        break
    }
  }
  return null
}

export function validateAllFields(
  values: Record<string, string>,
  fieldRules: FieldRules
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const [field, rules] of Object.entries(fieldRules)) {
    const error = validateField(values[field] || '', rules)
    if (error) errors[field] = error
  }
  return errors
}
