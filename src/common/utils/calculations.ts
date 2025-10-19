/**
 * Pure calculation functions for financial accuracy
 * All calculations use numeral.js to avoid floating point errors
 * Formatting uses numeral.js for proper locale support
 */

import numeral from 'numeral'
import {
  InvoiceLineItem,
  LineItemCalculation,
  InvoiceCalculation,
} from 'common/types/invoice.types'

/**
 * Calculates line item totals using numeral.js for precision
 * Formula: (quantity × unit_price) + VAT
 * Rounds at each step to avoid cumulative rounding errors
 */
export const calculateLineItem = (
  item: InvoiceLineItem
): LineItemCalculation => {
  // Calculate subtotal using numeral.js multiply and round to 2 decimals
  const subtotalRaw =
    numeral(item.unit_price).multiply(item.quantity).value() || 0
  const subtotal = Number(subtotalRaw.toFixed(2))

  // Calculate VAT (convert string to number if needed)
  const vatRate =
    typeof item.vat_rate === 'string'
      ? parseFloat(item.vat_rate)
      : item.vat_rate || 0

  // Calculate VAT amount on ROUNDED subtotal: subtotal * (vatRate / 100)
  const vatAmountRaw =
    numeral(subtotal).multiply(vatRate).divide(100).value() || 0
  const vatAmount = Number(vatAmountRaw.toFixed(2))

  // Calculate total using numeral.js add on ROUNDED values
  const totalRaw = numeral(subtotal).add(vatAmount).value() || 0
  const total = Number(totalRaw.toFixed(2))

  return {
    subtotal,
    vatAmount,
    total,
  }
}

/**
 * Calculates invoice totals from line items using numeral.js
 */
export const calculateInvoiceTotals = (
  lineItems: InvoiceLineItem[]
): InvoiceCalculation => {
  // Initialize accumulators using numeral
  let subtotalNum = numeral(0)
  let totalVatNum = numeral(0)
  const vatBreakdown: Record<number, number> = {}

  // Calculate each line item
  lineItems.forEach((item) => {
    const calc = calculateLineItem(item)

    // Accumulate totals using numeral.js add
    subtotalNum = numeral(subtotalNum.value()).add(calc.subtotal)
    totalVatNum = numeral(totalVatNum.value()).add(calc.vatAmount)

    // Track VAT breakdown by rate
    const vatRate =
      typeof item.vat_rate === 'string'
        ? parseFloat(item.vat_rate)
        : item.vat_rate || 0

    if (!vatBreakdown[vatRate]) {
      vatBreakdown[vatRate] = 0
    }
    // Add to VAT breakdown using numeral
    vatBreakdown[vatRate] =
      numeral(vatBreakdown[vatRate]).add(calc.vatAmount).value() || 0
  })

  // Calculate grand total using numeral.js add
  const grandTotalNum = numeral(subtotalNum.value()).add(totalVatNum.value())

  return {
    subtotal: Number((subtotalNum.value() || 0).toFixed(2)),
    totalVat: Number((totalVatNum.value() || 0).toFixed(2)),
    grandTotal: Number((grandTotalNum.value() || 0).toFixed(2)),
    vatBreakdown: Object.fromEntries(
      Object.entries(vatBreakdown).map(([rate, amount]) => [
        Number(rate),
        Number(amount.toFixed(2)),
      ])
    ),
  }
}

/**
 * Formats a number as currency using numeral.js
 * Always uses EUR (€) as the currency
 * @param amount - Amount to format
 */
export const formatCurrency = (amount: number): string => {
  // Format number with thousand separators and 2 decimals using numeral.js
  const formattedNumber = numeral(amount).format('0,0.00')

  // Prepend EUR symbol
  return `€${formattedNumber}`
}

/**
 * Ensures a value is a valid number for calculations
 * Returns 0 if invalid
 */
export const ensureNumber = (value: any): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}
