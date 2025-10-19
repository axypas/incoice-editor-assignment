/**
 * Tests for financial calculation utilities
 * Ensures decimal precision and accuracy for invoice calculations
 */

import {
  calculateLineItem,
  calculateInvoiceTotals,
  formatCurrency,
  ensureNumber,
} from './calculations'
import { InvoiceLineItem } from 'common/types/invoice.types'

describe('Financial Calculations', () => {
  describe('calculateLineItem', () => {
    const baseItem: InvoiceLineItem = {
      label: 'Test Item',
      quantity: 10,
      unit: 'hours',
      unit_price: 50.0,
      vat_rate: 20,
    }

    it('should calculate basic line item', () => {
      const result = calculateLineItem(baseItem)

      expect(result.subtotal).toBe(500.0) // 10 * 50
      expect(result.vatAmount).toBe(100.0) // 500 * 0.20
      expect(result.total).toBe(600.0) // 500 + 100
    })

    it('should handle fractional quantities correctly', () => {
      const item = { ...baseItem, quantity: 2.5, unit_price: 40.0 }
      const result = calculateLineItem(item)

      expect(result.subtotal).toBe(100.0) // 2.5 * 40
      expect(result.vatAmount).toBe(20.0) // 100 * 0.20
      expect(result.total).toBe(120.0)
    })

    it('should handle zero VAT rate', () => {
      const item = { ...baseItem, vat_rate: 0 }
      const result = calculateLineItem(item)

      expect(result.subtotal).toBe(500.0)
      expect(result.vatAmount).toBe(0)
      expect(result.total).toBe(500.0)
    })

    it('should handle complex decimal calculations', () => {
      const item: InvoiceLineItem = {
        label: 'Complex Item',
        quantity: 3.33,
        unit: 'items',
        unit_price: 19.99,
        vat_rate: 19,
      }
      const result = calculateLineItem(item)

      // 3.33 * 19.99 = 66.5667 → 66.57 (rounded)
      expect(result.subtotal).toBe(66.57)
      // 66.57 * 0.19 = 12.6483 → 12.65 (rounded)
      expect(result.vatAmount).toBe(12.65)
      // 66.57 + 12.65 = 79.22
      expect(result.total).toBe(79.22)
    })
  })

  describe('calculateInvoiceTotals', () => {
    it('should calculate totals for multiple line items', () => {
      const lineItems: InvoiceLineItem[] = [
        {
          label: 'Item 1',
          quantity: 2,
          unit: 'hours',
          unit_price: 100,
          vat_rate: 20,
        },
        {
          label: 'Item 2',
          quantity: 5,
          unit: 'items',
          unit_price: 50,
          vat_rate: 10,
        },
        {
          label: 'Item 3',
          quantity: 1,
          unit: 'service',
          unit_price: 300,
          vat_rate: 20,
        },
      ]

      const result = calculateInvoiceTotals(lineItems)

      // Item 1: 2 * 100 = 200, VAT = 40, Total = 240
      // Item 2: 5 * 50 = 250, VAT = 25, Total = 275
      // Item 3: 1 * 300 = 300, VAT = 60, Total = 360

      expect(result.subtotal).toBe(750.0) // 200 + 250 + 300
      expect(result.totalVat).toBe(125.0) // 40 + 25 + 60
      expect(result.grandTotal).toBe(875.0) // 750 + 125

      // VAT breakdown
      expect(result.vatBreakdown[20]).toBe(100.0) // Items 1 & 3
      expect(result.vatBreakdown[10]).toBe(25.0) // Item 2
    })

    it('should handle empty line items array', () => {
      const result = calculateInvoiceTotals([])

      expect(result.subtotal).toBe(0)
      expect(result.totalVat).toBe(0)
      expect(result.grandTotal).toBe(0)
      expect(Object.keys(result.vatBreakdown).length).toBe(0)
    })

    it('should correctly accumulate VAT by rate', () => {
      const lineItems: InvoiceLineItem[] = [
        { label: 'A', quantity: 1, unit: 'pc', unit_price: 100, vat_rate: 20 },
        { label: 'B', quantity: 1, unit: 'pc', unit_price: 100, vat_rate: 20 },
        { label: 'C', quantity: 1, unit: 'pc', unit_price: 100, vat_rate: 10 },
        { label: 'D', quantity: 1, unit: 'pc', unit_price: 100, vat_rate: 0 },
      ]

      const result = calculateInvoiceTotals(lineItems)

      expect(result.vatBreakdown[20]).toBe(40.0) // 2 items at 20%
      expect(result.vatBreakdown[10]).toBe(10.0) // 1 item at 10%
      expect(result.vatBreakdown[0]).toBe(0) // 1 item at 0%
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with correct symbols and separators', () => {
      expect(formatCurrency(1234.56, 'USD', 'en-US')).toBe('$1,234.56')
      expect(formatCurrency(1234.56, 'EUR', 'fr-FR')).toMatch(/1\s?234,56/)
      expect(formatCurrency(1234.5, 'GBP', 'en-GB')).toBe('£1,234.50')
    })

    it('should always show 2 decimal places', () => {
      expect(formatCurrency(100, 'USD')).toMatch(/\.00/)
      expect(formatCurrency(100.5, 'USD')).toMatch(/\.50/)
      expect(formatCurrency(100.999, 'USD')).toMatch(/101\.00/) // Rounds up
    })
  })

  describe('ensureNumber', () => {
    it('should convert various inputs to numbers safely', () => {
      expect(ensureNumber(10)).toBe(10)
      expect(ensureNumber('10')).toBe(10)
      expect(ensureNumber('10.5')).toBe(10.5)
      expect(ensureNumber(null)).toBe(0)
      expect(ensureNumber(undefined)).toBe(0)
      expect(ensureNumber('abc')).toBe(0)
      expect(ensureNumber(NaN)).toBe(0)
      expect(ensureNumber(Infinity)).toBe(0)
    })
  })
})
