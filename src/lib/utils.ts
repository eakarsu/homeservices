import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

export function generateJobNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `JOB-${year}${month}-${random}`
}

export function generateEstimateNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `EST-${year}${month}-${random}`
}

export function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV-${year}${month}-${random}`
}

export function generateCustomerNumber(): string {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `CUS-${random}`
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Job statuses
    PENDING: 'bg-yellow-100 text-yellow-800',
    SCHEDULED: 'bg-blue-100 text-blue-800',
    DISPATCHED: 'bg-indigo-100 text-indigo-800',
    EN_ROUTE: 'bg-purple-100 text-purple-800',
    IN_PROGRESS: 'bg-cyan-100 text-cyan-800',
    ON_HOLD: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    INVOICED: 'bg-emerald-100 text-emerald-800',

    // Invoice statuses
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    VIEWED: 'bg-indigo-100 text-indigo-800',
    PARTIAL: 'bg-orange-100 text-orange-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    VOID: 'bg-gray-100 text-gray-600',

    // Estimate statuses
    APPROVED: 'bg-green-100 text-green-800',
    DECLINED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-600',
    CONVERTED: 'bg-emerald-100 text-emerald-800',

    // Agreement statuses
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-600',
    SUSPENDED: 'bg-orange-100 text-orange-800',

    // Customer statuses
    VIP: 'bg-purple-100 text-purple-800',
    DO_NOT_SERVICE: 'bg-red-100 text-red-800',

    // Tech statuses
    AVAILABLE: 'bg-green-100 text-green-800',
    ON_JOB: 'bg-blue-100 text-blue-800',
    BREAK: 'bg-yellow-100 text-yellow-800',
    OFF_DUTY: 'bg-gray-100 text-gray-600',
  }

  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

export function getPriorityColor(priority: string): string {
  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-800',
    NORMAL: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
    EMERGENCY: 'bg-red-200 text-red-900',
  }

  return priorityColors[priority] || 'bg-gray-100 text-gray-800'
}

export function getTradeColor(tradeType: string): string {
  const tradeColors: Record<string, string> = {
    HVAC: 'bg-blue-100 text-blue-800',
    PLUMBING: 'bg-cyan-100 text-cyan-800',
    ELECTRICAL: 'bg-yellow-100 text-yellow-800',
    GENERAL: 'bg-gray-100 text-gray-800',
  }

  return tradeColors[tradeType] || 'bg-gray-100 text-gray-800'
}
