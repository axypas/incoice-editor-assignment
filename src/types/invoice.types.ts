/**
 * Domain types for Invoice management
 * Following Pennylane's domain-first naming convention
 */

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

export interface Product {
  id: string
  label: string
  unit: string
  vat_rate: number
  unit_price: number
  currency?: string
}

export interface InvoiceLineItem {
  id?: string
  product_id?: string
  product?: Product
  label: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: number
  discount?: number // Percentage discount (0-100)
  discount_amount?: number // Fixed amount discount
}

export interface Invoice {
  id?: string
  invoice_number: string
  customer_id: string
  customer?: Customer
  date: string // ISO date string
  deadline?: string // ISO date string
  finalized: boolean
  paid: boolean
  currency?: string
  invoice_lines: InvoiceLineItem[]
  tax?: number
  total?: number
  notes?: string
  terms?: string
}

// Form-specific types for create/edit
export interface InvoiceFormData {
  customer_id: string
  invoice_number: string
  date: string
  deadline?: string
  invoice_lines: InvoiceLineFormData[]
  notes?: string
  terms?: string
}

export interface InvoiceLineFormData {
  label: string
  quantity: string // String for form input
  unit: string
  unit_price: string // String for form input
  vat_rate: string // String for form input
  discount?: string // String for form input
}

// Calculation types
export interface LineItemCalculation {
  subtotal: number // quantity * unit_price
  discountAmount: number
  taxableAmount: number // subtotal - discount
  vatAmount: number
  total: number // taxableAmount + vatAmount
}

export interface InvoiceCalculation {
  subtotal: number // Sum of all line subtotals
  totalDiscount: number
  taxableAmount: number
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

// Auto-save specific types
export interface AutoSaveState {
  lastSaved: Date | null
  isDirty: boolean
  isSaving: boolean
  error: Error | null
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

// Action types for invoice operations
export type InvoiceAction =
  | 'create'
  | 'edit'
  | 'finalize'
  | 'delete'
  | 'duplicate'
  | 'view'

// Permission check for actions based on invoice state
export const canPerformAction = (
  invoice: Invoice,
  action: InvoiceAction
): boolean => {
  switch (action) {
    case 'edit':
      return !invoice.finalized
    case 'finalize':
      return !invoice.finalized
    case 'delete':
      return !invoice.finalized // Based on Pennylane v2 API constraints
    case 'duplicate':
      return true
    case 'view':
      return true
    default:
      return false
  }
}

// Type guards
export const isInvoice = (obj: any): obj is Invoice => {
  return (
    obj &&
    typeof obj.invoice_number === 'string' &&
    typeof obj.customer_id === 'string' &&
    Array.isArray(obj.invoice_lines)
  )
}

export const isValidLineItem = (item: any): item is InvoiceLineItem => {
  return (
    item &&
    typeof item.label === 'string' &&
    typeof item.quantity === 'number' &&
    typeof item.unit_price === 'number'
  )
}
