import { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      technicianId?: string
      companyId: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
    technicianId?: string
    companyId: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    technicianId?: string
    companyId?: string
  }
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Common types
export interface Address {
  address: string
  address2?: string
  city: string
  state: string
  zip: string
  lat?: number
  lng?: number
}

export interface TimeWindow {
  start: string
  end: string
}

// Customer types
export interface CustomerSummary {
  id: string
  customerNumber: string
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
  type: string
  status: string
  propertyCount: number
  jobCount: number
  totalSpent: number
}

// Job types
export interface JobSummary {
  id: string
  jobNumber: string
  title: string
  status: string
  priority: string
  type: string
  tradeType: string
  scheduledStart?: Date
  customer: {
    id: string
    firstName?: string
    lastName?: string
    companyName?: string
    phone?: string
  }
  property?: {
    id: string
    address: string
    city: string
    state: string
  }
  technician?: {
    id: string
    userId: string
    user: {
      firstName: string
      lastName: string
    }
  }
}

// Technician types
export interface TechnicianSummary {
  id: string
  employeeId?: string
  userId: string
  user: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  tradeTypes: string[]
  status: string
  currentLat?: number
  currentLng?: number
  jobsToday: number
  jobsCompleted: number
}

// Dashboard types
export interface DashboardStats {
  todayJobs: number
  pendingJobs: number
  completedToday: number
  revenue: {
    today: number
    week: number
    month: number
  }
  techniciansAvailable: number
  openEstimates: number
  overdueInvoices: number
  expiringAgreements: number
}

// Dispatch types
export interface DispatchJob {
  id: string
  jobNumber: string
  title: string
  status: string
  priority: string
  type: string
  tradeType: string
  timeWindowStart?: string
  timeWindowEnd?: string
  estimatedDuration?: number
  customer: {
    id: string
    firstName?: string
    lastName?: string
    phone?: string
  }
  property?: {
    id: string
    address: string
    city: string
    lat?: number
    lng?: number
  }
  assignedTechnician?: {
    id: string
    user: {
      firstName: string
      lastName: string
    }
  }
}

export interface DispatchTechnician {
  id: string
  user: {
    firstName: string
    lastName: string
    phone?: string
  }
  status: string
  tradeTypes: string[]
  currentLat?: number
  currentLng?: number
  currentJob?: {
    id: string
    jobNumber: string
    address: string
  }
  todayJobs: DispatchJob[]
}

// Estimate types
export interface EstimateOption {
  id?: string
  name: string
  description?: string
  sortOrder: number
  subtotal: number
  taxAmount: number
  totalAmount: number
  isRecommended: boolean
  lineItems: EstimateLineItem[]
}

export interface EstimateLineItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category?: string
  sortOrder: number
  isOptional: boolean
}

// Invoice types
export interface InvoiceLineItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category?: string
  sortOrder: number
}

// Filter types
export interface JobFilters {
  status?: string
  priority?: string
  tradeType?: string
  technicianId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

export interface CustomerFilters {
  status?: string
  type?: string
  search?: string
}

export interface InvoiceFilters {
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}
