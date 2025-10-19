/**
 * Validation utilities for invoice forms
 * Following Pennylane's principle: validate on blur, positive language
 */

import {
  Invoice,
  InvoiceFormData,
  InvoiceLineFormData,
  ValidationError,
  ValidationResult,
} from 'common/types/invoice.types'
import { parseFormattedNumber, isValidCurrencyAmount } from './calculations'

/**
 * Validates a single invoice line item
 */
export const validateLineItem = (
  item: InvoiceLineFormData,
  index: number
): ValidationError[] => {
  const errors: ValidationError[] = []
  const fieldPrefix = `invoice_lines.${index}`

  // Label is required
  if (!item.label || item.label.trim().length === 0) {
    errors.push({
      field: `${fieldPrefix}.label`,
      message: 'Please enter a description for this item',
      code: 'required',
    })
  }

  // Quantity validation
  const quantity = parseFormattedNumber(item.quantity)
  if (!item.quantity) {
    errors.push({
      field: `${fieldPrefix}.quantity`,
      message: 'Please enter a quantity',
      code: 'required',
    })
  } else if (quantity <= 0) {
    errors.push({
      field: `${fieldPrefix}.quantity`,
      message: 'Quantity must be greater than 0',
      code: 'min',
    })
  } else if (quantity > 999999) {
    errors.push({
      field: `${fieldPrefix}.quantity`,
      message: 'Quantity cannot exceed 999,999',
      code: 'max',
    })
  }

  // Unit price validation
  const unitPrice = parseFormattedNumber(item.unit_price)
  if (!item.unit_price) {
    errors.push({
      field: `${fieldPrefix}.unit_price`,
      message: 'Please enter a unit price',
      code: 'required',
    })
  } else if (unitPrice < 0) {
    errors.push({
      field: `${fieldPrefix}.unit_price`,
      message: 'Unit price cannot be negative',
      code: 'min',
    })
  } else if (!isValidCurrencyAmount(unitPrice)) {
    errors.push({
      field: `${fieldPrefix}.unit_price`,
      message: 'Please enter a valid price (max 2 decimal places)',
      code: 'format',
    })
  }

  // Unit validation
  if (!item.unit || item.unit.trim().length === 0) {
    errors.push({
      field: `${fieldPrefix}.unit`,
      message: 'Please specify a unit (e.g., hours, items)',
      code: 'required',
    })
  }

  // VAT rate validation
  const vatRate = parseFormattedNumber(item.vat_rate || '0')
  if (vatRate < 0 || vatRate > 100) {
    errors.push({
      field: `${fieldPrefix}.vat_rate`,
      message: 'VAT rate must be between 0% and 100%',
      code: 'invalid',
    })
  }

  // Discount validation (if provided)
  if (item.discount) {
    const discount = parseFormattedNumber(item.discount)
    if (discount < 0 || discount > 100) {
      errors.push({
        field: `${fieldPrefix}.discount`,
        message: 'Discount must be between 0% and 100%',
        code: 'invalid',
      })
    }
  }

  return errors
}

/**
 * Validates the entire invoice form
 */
export const validateInvoiceForm = (
  formData: InvoiceFormData
): ValidationResult => {
  const errors: ValidationError[] = []

  // Customer is required
  if (!formData.customer_id) {
    errors.push({
      field: 'customer_id',
      message: 'Please select a customer',
      code: 'required',
    })
  }

  // Invoice number is required
  if (!formData.invoice_number || formData.invoice_number.trim().length === 0) {
    errors.push({
      field: 'invoice_number',
      message: 'Please enter an invoice number',
      code: 'required',
    })
  } else if (formData.invoice_number.length > 50) {
    errors.push({
      field: 'invoice_number',
      message: 'Invoice number cannot exceed 50 characters',
      code: 'max',
    })
  }

  // Date validation
  if (!formData.date) {
    errors.push({
      field: 'date',
      message: 'Please select an invoice date',
      code: 'required',
    })
  } else if (!isValidDate(formData.date)) {
    errors.push({
      field: 'date',
      message: 'Please enter a valid date (YYYY-MM-DD)',
      code: 'format',
    })
  }

  // Deadline validation (if provided)
  if (formData.deadline) {
    if (!isValidDate(formData.deadline)) {
      errors.push({
        field: 'deadline',
        message: 'Please enter a valid due date (YYYY-MM-DD)',
        code: 'format',
      })
    } else if (
      formData.date &&
      new Date(formData.deadline) < new Date(formData.date)
    ) {
      errors.push({
        field: 'deadline',
        message: 'Due date cannot be before invoice date',
        code: 'invalid',
      })
    }
  }

  // At least one line item is required
  if (!formData.invoice_lines || formData.invoice_lines.length === 0) {
    errors.push({
      field: 'invoice_lines',
      message: 'Please add at least one line item',
      code: 'required',
    })
  } else {
    // Validate each line item
    formData.invoice_lines.forEach((item, index) => {
      errors.push(...validateLineItem(item, index))
    })
  }

  // Notes/terms length validation
  if (formData.notes && formData.notes.length > 1000) {
    errors.push({
      field: 'notes',
      message: 'Notes cannot exceed 1000 characters',
      code: 'max',
    })
  }

  if (formData.terms && formData.terms.length > 1000) {
    errors.push({
      field: 'terms',
      message: 'Terms cannot exceed 1000 characters',
      code: 'max',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validates if a date string is in valid ISO format
 */
export const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false

  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) return false

  // Parse the components
  const [year, month, day] = dateString.split('-').map(Number)

  // Check if it's a valid date
  const date = new Date(dateString + 'T00:00:00')
  if (!(date instanceof Date) || isNaN(date.getTime())) return false

  // Verify the date components match (catches invalid dates like 2024-02-30)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 && // getMonth is 0-indexed
    date.getDate() === day
  )
}

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates invoice number format
 * Allows alphanumeric with dashes and underscores
 */
export const isValidInvoiceNumber = (number: string): boolean => {
  if (!number) return false
  const invoiceNumberRegex = /^[A-Za-z0-9\-_]+$/
  return invoiceNumberRegex.test(number) && number.length <= 50
}

/**
 * Gets field-specific error from validation errors array
 */
export const getFieldError = (
  errors: ValidationError[],
  fieldName: string
): string | undefined => {
  const error = errors.find((e) => e.field === fieldName)
  return error?.message
}

/**
 * Checks if a field has an error
 */
export const hasFieldError = (
  errors: ValidationError[],
  fieldName: string
): boolean => {
  return errors.some((e) => e.field === fieldName)
}

/**
 * Groups validation errors by field
 */
export const groupErrorsByField = (
  errors: ValidationError[]
): Record<string, string[]> => {
  const grouped: Record<string, string[]> = {}

  errors.forEach((error) => {
    if (!grouped[error.field]) {
      grouped[error.field] = []
    }
    grouped[error.field].push(error.message)
  })

  return grouped
}

/**
 * Validates that an invoice can be finalized
 */
export const canFinalizeInvoice = (invoice: Invoice): ValidationResult => {
  const errors: ValidationError[] = []

  if (invoice.finalized) {
    errors.push({
      field: 'finalized',
      message: 'This invoice is already finalized',
      code: 'invalid',
    })
  }

  if (!invoice.customer_id) {
    errors.push({
      field: 'customer_id',
      message: 'Cannot finalize invoice without a customer',
      code: 'required',
    })
  }

  if (!invoice.invoice_lines || invoice.invoice_lines.length === 0) {
    errors.push({
      field: 'invoice_lines',
      message: 'Cannot finalize invoice without line items',
      code: 'required',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validates that an invoice can be deleted
 */
export const canDeleteInvoice = (invoice: Invoice): ValidationResult => {
  const errors: ValidationError[] = []

  if (invoice.finalized) {
    errors.push({
      field: 'finalized',
      message: 'Cannot delete a finalized invoice',
      code: 'invalid',
    })
  }

  if (invoice.paid) {
    errors.push({
      field: 'paid',
      message: 'Cannot delete a paid invoice',
      code: 'invalid',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
