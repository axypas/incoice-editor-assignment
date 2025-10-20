/**
 * Tests for financial calculation utilities
 * Ensures decimal precision and accuracy for invoice calculations
 */

import {
  calculateLineItem,
  calculateInvoiceTotals,
  formatCurrency,
} from './calculations'
import { InvoiceLineItem, Product } from 'common/types/invoice.types'

/**
 * Helper to create BE-compliant test InvoiceLine
 * BE uses: number IDs, string price, specific Unit/VatRate literals
 */
const createTestLineItem = (
  overrides: Partial<InvoiceLineItem> = {}
): InvoiceLineItem => {
  const mockProduct: Product = {
    id: 1,
    label: 'Test Product',
    vat_rate: '20',
    unit: 'hour',
    unit_price: '50.00',
    unit_price_without_tax: '50.00',
    unit_tax: '10.00',
  }

  return {
    id: 1,
    invoice_id: 1,
    product_id: 1,
    label: 'Test Item',
    quantity: 10,
    unit: 'hour',
    price: '50.00', // BE uses 'price' (string)
    vat_rate: '20', // BE VatRate: "0" | "5.5" | "10" | "20"
    tax: '100.00',
    product: mockProduct,
    ...overrides,
  }
}

describe('Financial Calculations', () => {
  describe('calculateLineItem', () => {
    const baseItem = createTestLineItem()

    it('should calculate basic line item', () => {
      const result = calculateLineItem(baseItem)

      expect(result.subtotal).toBe(500.0) // 10 * 50
      expect(result.vatAmount).toBe(100.0) // 500 * 0.20
      expect(result.total).toBe(600.0) // 500 + 100
    })

    it('should handle fractional quantities correctly', () => {
      const item = createTestLineItem({ quantity: 2.5, price: '40.00' })
      const result = calculateLineItem(item)

      expect(result.subtotal).toBe(100.0) // 2.5 * 40
      expect(result.vatAmount).toBe(20.0) // 100 * 0.20
      expect(result.total).toBe(120.0)
    })

    it('should handle zero VAT rate', () => {
      const item = createTestLineItem({ vat_rate: '0' })
      const result = calculateLineItem(item)

      expect(result.subtotal).toBe(500.0)
      expect(result.vatAmount).toBe(0)
      expect(result.total).toBe(500.0)
    })

    it('should handle complex decimal calculations', () => {
      const item = createTestLineItem({
        label: 'Complex Item',
        quantity: 3.33,
        unit: 'piece',
        price: '19.99',
        vat_rate: '20', // Changed from 19 (invalid) to 20 (valid)
      })
      const result = calculateLineItem(item)

      // 3.33 * 19.99 = 66.5667 → 66.57 (rounded)
      expect(result.subtotal).toBe(66.57)
      // 66.57 * 0.20 = 13.314 → 13.31 (rounded)
      expect(result.vatAmount).toBe(13.31)
      // 66.57 + 13.31 = 79.88
      expect(result.total).toBe(79.88)
    })
  })

  describe('calculateInvoiceTotals', () => {
    it('should calculate totals for multiple line items', () => {
      const lineItems: InvoiceLineItem[] = [
        createTestLineItem({
          label: 'Item 1',
          quantity: 2,
          unit: 'hour',
          price: '100',
          vat_rate: '20',
        }),
        createTestLineItem({
          label: 'Item 2',
          quantity: 5,
          unit: 'piece',
          price: '50',
          vat_rate: '10',
        }),
        createTestLineItem({
          label: 'Item 3',
          quantity: 1,
          unit: 'day',
          price: '300',
          vat_rate: '20',
        }),
      ]

      const result = calculateInvoiceTotals(lineItems)

      // Item 1: 2 * 100 = 200, VAT = 40, Total = 240
      // Item 2: 5 * 50 = 250, VAT = 25, Total = 275
      // Item 3: 1 * 300 = 300, VAT = 60, Total = 360

      expect(result.subtotal).toBe(750.0) // 200 + 250 + 300
      expect(result.totalVat).toBe(125.0) // 40 + 25 + 60
      expect(result.grandTotal).toBe(875.0) // 750 + 125

      // VAT breakdown
      expect(result.vatBreakdown['20']).toBe(100.0) // Items 1 & 3
      expect(result.vatBreakdown['10']).toBe(25.0) // Item 2
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
        createTestLineItem({
          label: 'A',
          quantity: 1,
          price: '100',
          vat_rate: '20',
        }),
        createTestLineItem({
          label: 'B',
          quantity: 1,
          price: '100',
          vat_rate: '20',
        }),
        createTestLineItem({
          label: 'C',
          quantity: 1,
          price: '100',
          vat_rate: '10',
        }),
        createTestLineItem({
          label: 'D',
          quantity: 1,
          price: '100',
          vat_rate: '0',
        }),
      ]

      const result = calculateInvoiceTotals(lineItems)

      expect(result.vatBreakdown['20']).toBe(40.0) // 2 items at 20%
      expect(result.vatBreakdown['10']).toBe(10.0) // 1 item at 10%
      expect(result.vatBreakdown['0']).toBe(0) // 1 item at 0%
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with EUR symbol and numeral.js', () => {
      expect(formatCurrency(1234.56)).toBe('€1,234.56')
      expect(formatCurrency(1234.5)).toBe('€1,234.50')
    })

    it('should always show 2 decimal places', () => {
      expect(formatCurrency(100)).toBe('€100.00')
      expect(formatCurrency(100.5)).toBe('€100.50')
      expect(formatCurrency(101)).toBe('€101.00')
    })

    it('should handle negative amounts', () => {
      expect(formatCurrency(-1234.56)).toBe('€-1,234.56')
    })
  })
})
