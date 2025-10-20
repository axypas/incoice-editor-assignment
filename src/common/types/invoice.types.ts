/**
 * Frontend-specific types for Invoice management
 * Note: Base types (Invoice, Customer, Product) come from common/types (BE OpenAPI client)
 * This file only contains FE-specific utility types
 */

// Re-export BE types for convenience
export type { Invoice, Customer, Product, InvoiceLine } from 'common/types'

// Alias for backwards compatibility (FE used to call it InvoiceLineItem)
export type { InvoiceLine as InvoiceLineItem } from 'common/types'

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

// Status types for async operations
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

// Validation types
export interface ValidationError {
  field: string
  message: string
  code: 'required' | 'invalid' | 'min' | 'max' | 'format' | 'duplicate'
}
