/**
 * Tests for useInvoiceCalculations hook
 * Covers: reactive calculation updates when line items change
 */

import { renderHook } from '@testing-library/react'
import { useInvoiceCalculations } from './useInvoiceCalculations'
import type { Product } from 'common/types'

describe('useInvoiceCalculations', () => {
  const mockProduct: Product = {
    id: 1,
    label: 'Test Product',
    unit: 'piece',
    unit_price: '120.00',
    unit_price_without_tax: '100.00',
    unit_tax: '10.00',
    vat_rate: '10',
  }

  const createLineItem = (quantity: number, unitPrice: number) => ({
    product: mockProduct,
    product_id: '1',
    label: 'Test Product',
    quantity,
    unit: 'piece',
    unit_price: unitPrice,
    vat_rate: '10',
  })

  it('should calculate initial totals correctly', () => {
    const lineItems = [createLineItem(1, 100)]

    const { result } = renderHook(() => useInvoiceCalculations({ lineItems }))

    expect(result.current.totals).toEqual({
      subtotal: 100,
      totalVat: 10,
      grandTotal: 110,
      vatBreakdown: { 10: 10 },
    })

    expect(result.current.perLine).toEqual([
      {
        subtotal: 100,
        vatAmount: 10,
        total: 110,
      },
    ])
  })

  it('should recalculate totals when quantity changes in existing line item', () => {
    let lineItems = [createLineItem(1, 100)]

    const { result, rerender } = renderHook(
      ({ lineItems }) => useInvoiceCalculations({ lineItems }),
      { initialProps: { lineItems } }
    )

    // Initial calculation
    expect(result.current.totals.grandTotal).toBe(110)
    expect(result.current.perLine[0].total).toBe(110)

    // Change quantity to 3
    lineItems = [createLineItem(3, 100)]
    rerender({ lineItems })

    // Should recalculate: 3 × 100 = 300 + 10% VAT = 330
    expect(result.current.totals.subtotal).toBe(300)
    expect(result.current.totals.totalVat).toBe(30)
    expect(result.current.totals.grandTotal).toBe(330)
    expect(result.current.perLine[0]).toEqual({
      subtotal: 300,
      vatAmount: 30,
      total: 330,
    })
  })

  it('should recalculate totals when a line item is cloned', () => {
    let lineItems = [createLineItem(1, 100)]

    const { result, rerender } = renderHook(
      ({ lineItems }) => useInvoiceCalculations({ lineItems }),
      { initialProps: { lineItems } }
    )

    // Initial: 1 item
    expect(result.current.totals.grandTotal).toBe(110)

    // Clone the line item (simulate duplicate action)
    lineItems = [createLineItem(1, 100), createLineItem(1, 100)]
    rerender({ lineItems })

    // Should double: 2 × 110 = 220
    expect(result.current.totals.subtotal).toBe(200)
    expect(result.current.totals.totalVat).toBe(20)
    expect(result.current.totals.grandTotal).toBe(220)
    expect(result.current.perLine).toHaveLength(2)
  })

  it('should recalculate totals when quantity changes after cloning', () => {
    let lineItems = [createLineItem(1, 100), createLineItem(1, 100)]

    const { result, rerender } = renderHook(
      ({ lineItems }) => useInvoiceCalculations({ lineItems }),
      { initialProps: { lineItems } }
    )

    // Initial: 2 items with qty=1 each
    expect(result.current.totals.grandTotal).toBe(220)

    // Change first item quantity to 3, keep second at 1
    lineItems = [createLineItem(3, 100), createLineItem(1, 100)]
    rerender({ lineItems })

    // Should recalculate: (3×100 + 10%) + (1×100 + 10%) = 330 + 110 = 440
    expect(result.current.totals.subtotal).toBe(400)
    expect(result.current.totals.totalVat).toBe(40)
    expect(result.current.totals.grandTotal).toBe(440)
    expect(result.current.perLine[0].total).toBe(330)
    expect(result.current.perLine[1].total).toBe(110)
  })

  it('should handle multiple line items with different quantities', () => {
    const lineItems = [
      createLineItem(3, 100), // 300 + 30 VAT = 330
      createLineItem(5, 100), // 500 + 50 VAT = 550
    ]

    const { result } = renderHook(() => useInvoiceCalculations({ lineItems }))

    expect(result.current.totals.subtotal).toBe(800)
    expect(result.current.totals.totalVat).toBe(80)
    expect(result.current.totals.grandTotal).toBe(880)
    expect(result.current.perLine[0].total).toBe(330)
    expect(result.current.perLine[1].total).toBe(550)
  })

  it('should handle decimal quantities and prices correctly', () => {
    const lineItems = [createLineItem(2.5, 17718.18)]

    const { result } = renderHook(() => useInvoiceCalculations({ lineItems }))

    // 2.5 × 17718.18 = 44295.45 + 10% = 48724.995 ≈ 48725.00
    expect(result.current.totals.subtotal).toBe(44295.45)
    expect(result.current.totals.totalVat).toBe(4429.55)
    expect(result.current.totals.grandTotal).toBe(48725.0)
  })

  it('should recalculate when line item is removed', () => {
    let lineItems = [createLineItem(1, 100), createLineItem(2, 100)]

    const { result, rerender } = renderHook(
      ({ lineItems }) => useInvoiceCalculations({ lineItems }),
      { initialProps: { lineItems } }
    )

    // Initial: 110 + 220 = 330
    expect(result.current.totals.grandTotal).toBe(330)

    // Remove second item
    lineItems = [createLineItem(1, 100)]
    rerender({ lineItems })

    // Should recalculate to just first item
    expect(result.current.totals.grandTotal).toBe(110)
    expect(result.current.perLine).toHaveLength(1)
  })

  it('should handle empty line items array', () => {
    const lineItems: any[] = []

    const { result } = renderHook(() => useInvoiceCalculations({ lineItems }))

    expect(result.current.totals).toEqual({
      subtotal: 0,
      totalVat: 0,
      grandTotal: 0,
      vatBreakdown: {},
    })
    expect(result.current.perLine).toEqual([])
  })

  it('should track VAT breakdown by rate', () => {
    const lineItems = [
      createLineItem(1, 100), // 10% VAT = 10
      {
        ...createLineItem(1, 200),
        vat_rate: '20', // 20% VAT = 40
      },
    ]

    const { result } = renderHook(() => useInvoiceCalculations({ lineItems }))

    expect(result.current.totals.vatBreakdown).toEqual({
      10: 10,
      20: 40,
    })
    expect(result.current.totals.totalVat).toBe(50)
  })
})
