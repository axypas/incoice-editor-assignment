/**
 * Pure calculation functions for financial accuracy
 * All calculations use integer math to avoid floating point errors
 * Amounts are stored in cents and converted for display
 */

import {
  InvoiceLineItem,
  LineItemCalculation,
  InvoiceCalculation,
  Invoice,
} from 'common/types/invoice.types'

/**
 * Converts amount to cents for precise calculation
 * @param amount - Amount in decimal format
 * @returns Amount in cents (integer)
 */
export const toCents = (amount: number): number => {
  return Math.round(amount * 100)
}

/**
 * Converts cents back to decimal with 2 decimal places
 * @param cents - Amount in cents
 * @returns Amount in decimal format
 */
export const fromCents = (cents: number): number => {
  return Math.round(cents) / 100
}

/**
 * Calculates line item totals with proper decimal precision
 * Formula: (quantity × unit_price) × (1 + vat_rate)
 */
export const calculateLineItem = (
  item: InvoiceLineItem
): LineItemCalculation => {
  // Convert to cents for precision
  const unitPriceCents = toCents(item.unit_price)
  const quantity = item.quantity

  // Calculate subtotal
  const subtotalCents = Math.round(unitPriceCents * quantity)

  // Calculate VAT (convert string to number if needed)
  const vatRate =
    typeof item.vat_rate === 'string'
      ? parseFloat(item.vat_rate)
      : item.vat_rate || 0
  const vatAmountCents = Math.round((subtotalCents * vatRate) / 100)

  // Total with VAT
  const totalCents = subtotalCents + vatAmountCents

  return {
    subtotal: fromCents(subtotalCents),
    vatAmount: fromCents(vatAmountCents),
    total: fromCents(totalCents),
  }
}

/**
 * Calculates invoice totals from line items
 */
export const calculateInvoiceTotals = (
  lineItems: InvoiceLineItem[]
): InvoiceCalculation => {
  // Initialize accumulators in cents
  let subtotalCents = 0
  let totalVatCents = 0
  const vatBreakdownCents: Record<number, number> = {}

  // Calculate each line item
  lineItems.forEach((item) => {
    const calc = calculateLineItem(item)

    // Accumulate totals (convert back to cents for precision)
    subtotalCents += toCents(calc.subtotal)
    totalVatCents += toCents(calc.vatAmount)

    // Track VAT breakdown by rate (convert string to number if needed)
    const vatRate =
      typeof item.vat_rate === 'string'
        ? parseFloat(item.vat_rate)
        : item.vat_rate || 0
    if (!vatBreakdownCents[vatRate]) {
      vatBreakdownCents[vatRate] = 0
    }
    vatBreakdownCents[vatRate] += toCents(calc.vatAmount)
  })

  const grandTotalCents = subtotalCents + totalVatCents

  // Convert VAT breakdown back to decimal
  const vatBreakdown: Record<number, number> = {}
  Object.entries(vatBreakdownCents).forEach(([rate, amount]) => {
    vatBreakdown[Number(rate)] = fromCents(amount)
  })

  return {
    subtotal: fromCents(subtotalCents),
    totalVat: fromCents(totalVatCents),
    grandTotal: fromCents(grandTotalCents),
    vatBreakdown,
  }
}

/**
 * Formats a number as currency with proper locale
 * @param amount - Amount to format
 * @param currency - Currency code (default EUR)
 * @param locale - Locale for formatting (default en-US)
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'EUR',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formats a number with thousand separators
 */
export const formatNumber = (
  amount: number,
  decimals: number = 2,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

/**
 * Parses a formatted number string to float
 * Handles different locale formats (comma vs period)
 */
export const parseFormattedNumber = (value: string): number => {
  // Remove all non-numeric characters except decimal separators
  const cleaned = value.replace(/[^\d.,-]/g, '')

  // Handle European format (comma as decimal separator)
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    return parseFloat(cleaned.replace(',', '.'))
  }

  // Handle format with thousand separators
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Assume comma is thousand separator if dot comes after
    if (cleaned.lastIndexOf('.') > cleaned.lastIndexOf(',')) {
      return parseFloat(cleaned.replace(/,/g, ''))
    }
    // Otherwise assume European format
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))
  }

  return parseFloat(cleaned) || 0
}

/**
 * Validates if a number is within acceptable range for currency
 */
export const isValidCurrencyAmount = (amount: number): boolean => {
  // Check for NaN, Infinity
  if (!Number.isFinite(amount)) return false

  // Check for reasonable range (up to 1 billion)
  if (Math.abs(amount) > 1_000_000_000) return false

  // Check decimal places (max 2 for currency)
  const decimalPart = (amount.toString().split('.')[1] || '').length
  if (decimalPart > 2) return false

  return true
}

/**
 * Checks if an invoice is overdue
 */
export const isOverdue = (invoice: Invoice): boolean => {
  if (invoice.paid || !invoice.deadline) return false

  const now = new Date()
  const deadline = new Date(invoice.deadline)
  return now > deadline
}

/**
 * Ensures a value is a valid number for calculations
 * Returns 0 if invalid
 */
export const ensureNumber = (value: any): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}
