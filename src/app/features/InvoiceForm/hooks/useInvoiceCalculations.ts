/**
 * useInvoiceCalculations hook
 * Calculates invoice totals and per-line calculations
 */

import { useMemo } from 'react'
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
  return useMemo(() => {
    const invoiceLineItems: InvoiceLineItem[] = lineItems.map((item) => ({
      product: item.product,
      product_id: item.product_id,
      label: item.label,
      quantity: item.quantity ?? 0,
      unit: item.unit,
      unit_price: item.unit_price ?? 0,
      vat_rate: item.vat_rate,
    }))

    return {
      totals: calculateInvoiceTotals(invoiceLineItems),
      perLine: invoiceLineItems.map((invoiceItem) =>
        calculateLineItem(invoiceItem)
      ),
      lineItems,
    }
  }, [lineItems])
}
