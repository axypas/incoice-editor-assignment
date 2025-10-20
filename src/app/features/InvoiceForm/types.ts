/**
 * Shared type definitions for InvoiceForm feature
 * Used across form components and hooks to ensure consistency
 */

import { Customer, Product } from 'common/types'

/**
 * Represents a single line item in the invoice form
 * Form uses unit_price (number) while BE uses price (string)
 */
export interface LineItemFormValue {
  id?: string // For existing line items in edit mode
  product: Product | null
  product_id?: string
  label: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: string
  _destroy?: boolean // For marking items for deletion
}

/**
 * Complete form values structure for the invoice form
 */
export interface InvoiceFormValues {
  customer: Customer | null
  date: Date | null
  deadline: Date | null
  paid: boolean
  finalized: boolean
  lineItems: LineItemFormValue[]
}
