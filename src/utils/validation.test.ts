/**
 * Tests for validation utilities
 * Ensures proper form validation with user-friendly messages
 */

import {
  validateLineItem,
  validateInvoiceForm,
  isValidDate,
  isValidEmail,
  isValidInvoiceNumber,
  getFieldError,
  hasFieldError,
  groupErrorsByField,
  canFinalizeInvoice,
  canDeleteInvoice,
} from '../utils/validation'
import {
  InvoiceFormData,
  InvoiceLineFormData,
  Invoice,
} from '../types/invoice.types'

describe('Validation Utilities', () => {
  describe('validateLineItem', () => {
    const validItem: InvoiceLineFormData = {
      label: 'Test Service',
      quantity: '10',
      unit: 'hours',
      unit_price: '50.00',
      vat_rate: '20',
    }

    it('should validate a valid line item', () => {
      const errors = validateLineItem(validItem, 0)
      expect(errors).toHaveLength(0)
    })

    it('should require label', () => {
      const item = { ...validItem, label: '' }
      const errors = validateLineItem(item, 0)

      expect(errors).toContainEqual({
        field: 'invoice_lines.0.label',
        message: 'Please enter a description for this item',
        code: 'required',
      })
    })

    it('should validate quantity constraints', () => {
      // Zero quantity
      let item = { ...validItem, quantity: '0' }
      let errors = validateLineItem(item, 0)
      expect(errors).toContainEqual({
        field: 'invoice_lines.0.quantity',
        message: 'Quantity must be greater than 0',
        code: 'min',
      })

      // Negative quantity
      item = { ...validItem, quantity: '-5' }
      errors = validateLineItem(item, 0)
      expect(errors).toContainEqual({
        field: 'invoice_lines.0.quantity',
        message: 'Quantity must be greater than 0',
        code: 'min',
      })

      // Excessive quantity
      item = { ...validItem, quantity: '1000000' }
      errors = validateLineItem(item, 0)
      expect(errors).toContainEqual({
        field: 'invoice_lines.0.quantity',
        message: 'Quantity cannot exceed 999,999',
        code: 'max',
      })
    })

    it('should validate unit price constraints', () => {
      // Negative price
      let item = { ...validItem, unit_price: '-10' }
      let errors = validateLineItem(item, 0)
      expect(errors).toContainEqual({
        field: 'invoice_lines.0.unit_price',
        message: 'Unit price cannot be negative',
        code: 'min',
      })

      // Invalid format (too many decimals)
      item = { ...validItem, unit_price: '10.999' }
      errors = validateLineItem(item, 0)
      expect(errors).toContainEqual({
        field: 'invoice_lines.0.unit_price',
        message: 'Please enter a valid price (max 2 decimal places)',
        code: 'format',
      })
    })

    it('should validate VAT rate range', () => {
      // Negative VAT
      let item = { ...validItem, vat_rate: '-5' }
      let errors = validateLineItem(item, 0)
      expect(errors).toContainEqual({
        field: 'invoice_lines.0.vat_rate',
        message: 'VAT rate must be between 0% and 100%',
        code: 'invalid',
      })

      // Excessive VAT
      item = { ...validItem, vat_rate: '150' }
      errors = validateLineItem(item, 0)
      expect(errors).toContainEqual({
        field: 'invoice_lines.0.vat_rate',
        message: 'VAT rate must be between 0% and 100%',
        code: 'invalid',
      })

      // Valid edge cases
      item = { ...validItem, vat_rate: '0' }
      errors = validateLineItem(item, 0)
      expect(errors).toHaveLength(0)

      item = { ...validItem, vat_rate: '100' }
      errors = validateLineItem(item, 0)
      expect(errors).toHaveLength(0)
    })

    it('should validate discount if provided', () => {
      // Valid percentage discount
      let item = { ...validItem, discount: '10' }
      let errors = validateLineItem(item, 0)
      expect(errors).toHaveLength(0)

      // Invalid discount
      item = { ...validItem, discount: '150' }
      errors = validateLineItem(item, 0)
      expect(errors).toContainEqual({
        field: 'invoice_lines.0.discount',
        message: 'Discount must be between 0% and 100%',
        code: 'invalid',
      })
    })
  })

  describe('validateInvoiceForm', () => {
    const validForm: InvoiceFormData = {
      customer_id: 'cust_123',
      invoice_number: 'INV-2024-001',
      date: '2024-01-15',
      deadline: '2024-02-15',
      invoice_lines: [
        {
          label: 'Service',
          quantity: '10',
          unit: 'hours',
          unit_price: '50',
          vat_rate: '20',
        },
      ],
      notes: 'Test notes',
      terms: 'Net 30',
    }

    it('should validate a complete valid form', () => {
      const result = validateInvoiceForm(validForm)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should require customer', () => {
      const form = { ...validForm, customer_id: '' }
      const result = validateInvoiceForm(form)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'customer_id',
        message: 'Please select a customer',
        code: 'required',
      })
    })

    it('should require invoice number', () => {
      const form = { ...validForm, invoice_number: '' }
      const result = validateInvoiceForm(form)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'invoice_number',
        message: 'Please enter an invoice number',
        code: 'required',
      })
    })

    it('should validate invoice number length', () => {
      const form = { ...validForm, invoice_number: 'A'.repeat(51) }
      const result = validateInvoiceForm(form)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'invoice_number',
        message: 'Invoice number cannot exceed 50 characters',
        code: 'max',
      })
    })

    it('should validate date format', () => {
      let form = { ...validForm, date: '2024/01/15' } // Wrong format
      let result = validateInvoiceForm(form)
      expect(result.errors).toContainEqual({
        field: 'date',
        message: 'Please enter a valid date (YYYY-MM-DD)',
        code: 'format',
      })

      form = { ...validForm, date: '2024-13-01' } // Invalid month
      result = validateInvoiceForm(form)
      expect(result.errors).toContainEqual({
        field: 'date',
        message: 'Please enter a valid date (YYYY-MM-DD)',
        code: 'format',
      })
    })

    it('should validate deadline is after date', () => {
      const form = {
        ...validForm,
        date: '2024-02-15',
        deadline: '2024-01-15', // Before invoice date
      }
      const result = validateInvoiceForm(form)

      expect(result.errors).toContainEqual({
        field: 'deadline',
        message: 'Due date cannot be before invoice date',
        code: 'invalid',
      })
    })

    it('should require at least one line item', () => {
      const form = { ...validForm, invoice_lines: [] }
      const result = validateInvoiceForm(form)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'invoice_lines',
        message: 'Please add at least one line item',
        code: 'required',
      })
    })

    it('should validate each line item', () => {
      const form = {
        ...validForm,
        invoice_lines: [
          { ...validForm.invoice_lines[0] }, // Valid
          { // Invalid
            label: '',
            quantity: '0',
            unit: '',
            unit_price: '-10',
            vat_rate: '20',
          },
        ],
      }
      const result = validateInvoiceForm(form)

      expect(result.valid).toBe(false)
      // Should have errors for the second line item
      expect(result.errors.some(e => e.field.startsWith('invoice_lines.1'))).toBe(true)
    })

    it('should validate notes and terms length', () => {
      const form = {
        ...validForm,
        notes: 'A'.repeat(1001),
        terms: 'B'.repeat(1001),
      }
      const result = validateInvoiceForm(form)

      expect(result.errors).toContainEqual({
        field: 'notes',
        message: 'Notes cannot exceed 1000 characters',
        code: 'max',
      })
      expect(result.errors).toContainEqual({
        field: 'terms',
        message: 'Terms cannot exceed 1000 characters',
        code: 'max',
      })
    })
  })

  describe('isValidDate', () => {
    it('should validate ISO date format', () => {
      expect(isValidDate('2024-01-15')).toBe(true)
      expect(isValidDate('2024-12-31')).toBe(true)

      expect(isValidDate('2024/01/15')).toBe(false)
      expect(isValidDate('15-01-2024')).toBe(false)
      expect(isValidDate('2024-13-01')).toBe(false) // Invalid month
      expect(isValidDate('2024-02-30')).toBe(false) // Invalid day
      expect(isValidDate('')).toBe(false)
      expect(isValidDate('not-a-date')).toBe(false)
    })
  })

  describe('isValidEmail', () => {
    it('should validate email format', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('user.name@example.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.com')).toBe(true)

      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('user @example.com')).toBe(false)
    })
  })

  describe('isValidInvoiceNumber', () => {
    it('should validate invoice number format', () => {
      expect(isValidInvoiceNumber('INV-2024-001')).toBe(true)
      expect(isValidInvoiceNumber('INV_2024_001')).toBe(true)
      expect(isValidInvoiceNumber('12345')).toBe(true)

      expect(isValidInvoiceNumber('')).toBe(false)
      expect(isValidInvoiceNumber('INV#2024')).toBe(false) // Invalid character
      expect(isValidInvoiceNumber('A'.repeat(51))).toBe(false) // Too long
    })
  })

  describe('Error helper functions', () => {
    const errors = [
      { field: 'customer_id', message: 'Required', code: 'required' as const },
      { field: 'date', message: 'Invalid date', code: 'format' as const },
      { field: 'date', message: 'Date too early', code: 'invalid' as const },
    ]

    it('should get field error', () => {
      expect(getFieldError(errors, 'customer_id')).toBe('Required')
      expect(getFieldError(errors, 'date')).toBe('Invalid date') // First error
      expect(getFieldError(errors, 'amount')).toBeUndefined()
    })

    it('should check if field has error', () => {
      expect(hasFieldError(errors, 'customer_id')).toBe(true)
      expect(hasFieldError(errors, 'date')).toBe(true)
      expect(hasFieldError(errors, 'amount')).toBe(false)
    })

    it('should group errors by field', () => {
      const grouped = groupErrorsByField(errors)
      expect(grouped).toEqual({
        customer_id: ['Required'],
        date: ['Invalid date', 'Date too early'],
      })
    })
  })

  describe('canFinalizeInvoice', () => {
    const validInvoice: Invoice = {
      id: '1',
      invoice_number: 'INV-001',
      customer_id: 'cust_123',
      date: '2024-01-15',
      finalized: false,
      paid: false,
      invoice_lines: [
        {
          label: 'Service',
          quantity: 1,
          unit: 'hour',
          unit_price: 100,
          vat_rate: 20,
        },
      ],
    }

    it('should allow finalizing valid draft invoice', () => {
      const result = canFinalizeInvoice(validInvoice)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should prevent finalizing already finalized invoice', () => {
      const invoice = { ...validInvoice, finalized: true }
      const result = canFinalizeInvoice(invoice)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'finalized',
        message: 'This invoice is already finalized',
        code: 'invalid',
      })
    })

    it('should require customer for finalization', () => {
      const invoice = { ...validInvoice, customer_id: '' }
      const result = canFinalizeInvoice(invoice)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'customer_id',
        message: 'Cannot finalize invoice without a customer',
        code: 'required',
      })
    })

    it('should require line items for finalization', () => {
      const invoice = { ...validInvoice, invoice_lines: [] }
      const result = canFinalizeInvoice(invoice)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'invoice_lines',
        message: 'Cannot finalize invoice without line items',
        code: 'required',
      })
    })
  })

  describe('canDeleteInvoice', () => {
    const draftInvoice: Invoice = {
      id: '1',
      invoice_number: 'INV-001',
      customer_id: 'cust_123',
      date: '2024-01-15',
      finalized: false,
      paid: false,
      invoice_lines: [],
    }

    it('should allow deleting draft invoice', () => {
      const result = canDeleteInvoice(draftInvoice)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should prevent deleting finalized invoice', () => {
      const invoice = { ...draftInvoice, finalized: true }
      const result = canDeleteInvoice(invoice)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'finalized',
        message: 'Cannot delete a finalized invoice',
        code: 'invalid',
      })
    })

    it('should prevent deleting paid invoice', () => {
      const invoice = { ...draftInvoice, paid: true }
      const result = canDeleteInvoice(invoice)

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'paid',
        message: 'Cannot delete a paid invoice',
        code: 'invalid',
      })
    })
  })
})