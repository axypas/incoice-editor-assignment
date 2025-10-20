/**
 * Shared utilities for InvoiceForm feature
 */

import { LineItemFormValue } from './types'

/**
 * Creates a default empty line item
 */
export const createDefaultLineItem = (): LineItemFormValue => ({
  product: null,
  product_id: undefined,
  label: '',
  quantity: 1,
  unit: 'piece',
  unit_price: 0,
  vat_rate: '0',
})
