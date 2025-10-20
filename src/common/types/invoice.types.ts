/**
 * Domain types for Invoice management
 * Following Pennylane's domain-first naming convention
 */

import { Product as APIProduct } from 'common/types'

export interface Customer {
  id: string
  label: string
  first_name: string
  last_name: string
  email?: string
  address?: string
  zip_code?: string
  city?: string
  country?: string
  country_code?: string
  country_alpha2?: string
  vat_number?: string
}

export interface InvoiceLineItem {
  id?: string
  product_id?: string
  product?: APIProduct | null
  label: string
  quantity: number
  unit: string // Enum: "hour" | "day" | "piece"
  unit_price: number
  vat_rate: string | number // API expects string enum: "0" | "5.5" | "10" | "20"
}

export interface Invoice {
  id: string
  customer_id?: string
  customer?: Customer
  date: string // ISO date string
  deadline?: string // ISO date string
  finalized: boolean
  paid: boolean
  invoice_lines: InvoiceLineItem[]
  tax?: number
  total?: number
}

// Re-export API Product type for convenience
export type { APIProduct as Product }

// Form-specific types for create/edit
export interface InvoiceFormData {
  customer_id: string
  date: string
  deadline?: string
  invoice_lines: InvoiceLineFormData[]
}

export interface InvoiceLineFormData {
  label: string
  quantity: string // String for form input
  unit: string
  unit_price: string // String for form input
  vat_rate: string // String for form input
}

// Calculation types
export interface LineItemCalculation {
  subtotal: number // quantity * unit_price
  vatAmount: number
  total: number // subtotal + vatAmount
}

export interface InvoiceCalculation {
  subtotal: number // Sum of all line subtotals
  totalVat: number
  grandTotal: number
  vatBreakdown: Record<number, number> // VAT rate -> amount
}

// Filter types for list view
export interface InvoiceFilter {
  field:
    | 'date'
    | 'deadline'
    | 'id'
    | 'customer_id'
    | 'finalized'
    | 'paid'
    | 'product_id'
    | 'invoice_lines.product_id'
  operator: 'eq' | 'gteq' | 'lteq' | 'start_with' | 'in'
  value: string | boolean | string[]
}

// API Response types
export interface ApiError {
  error: string
  message: string
  statusCode: number
  field?: string // For validation errors
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
}

// Status types for async operations
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  data: T | null
  status: AsyncStatus
  error: ApiError | null
}

// Validation types
export interface ValidationError {
  field: string
  message: string
  code: 'required' | 'invalid' | 'min' | 'max' | 'format' | 'duplicate'
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}
