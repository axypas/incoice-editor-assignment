/**
 * useInvoiceCalculations hook
 * Calculates invoice totals and per-line calculations
 *
 * Note: No memoization needed - calculations are pure, fast O(n),
 * and need to run on every render to stay reactive with form changes.
 */

import type { InvoiceLineItem } from 'common/types/invoice.types'
import {
  calculateLineItem,
  calculateInvoiceTotals,
} from 'common/utils/calculations'
import type { Product } from 'common/types'

interface LineItemFormValue {
  id?: string
  product: Product | null
  product_id?: string
  label: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: string
  _destroy?: boolean
}

interface UseInvoiceCalculationsOptions {
  lineItems: LineItemFormValue[]
}

export const useInvoiceCalculations = ({
  lineItems,
}: UseInvoiceCalculationsOptions) => {
  // Convert form line items to BE format for calculations
  // BE uses 'price' (string), form uses 'unit_price' (number)
  const invoiceLineItems: InvoiceLineItem[] = lineItems.map(
    (item): InvoiceLineItem => {
      // Cast to BE types (form uses string for flexibility, BE has specific literals)
      const vatRate = item.vat_rate as '0' | '5.5' | '10' | '20'
      const unit = (item.unit as 'hour' | 'day' | 'piece') || 'piece'

      // Create a default product if none exists (for new line items)
      const defaultProduct: Product = {
        id: 0,
        label: item.label || '',
        vat_rate: vatRate,
        unit: unit,
        unit_price: item.unit_price.toString(),
        unit_price_without_tax: '0',
        unit_tax: '0',
      }

      return {
        id: item.id ? parseInt(item.id, 10) : 0,
        invoice_id: 0, // Not needed for calculations
        product_id: item.product_id ? parseInt(item.product_id, 10) : 0,
        product: item.product || defaultProduct, // Ensure product is never null
        label: item.label || '',
        quantity: item.quantity ?? 0,
        unit: unit,
        price: (item.unit_price ?? 0).toString(), // Convert to string for BE type
        vat_rate: vatRate,
        tax: '0', // Calculated by calculations.ts
      }
    }
  )

  return {
    totals: calculateInvoiceTotals(invoiceLineItems),
    perLine: invoiceLineItems.map((invoiceItem) =>
      calculateLineItem(invoiceItem)
    ),
    lineItems,
  }
}
