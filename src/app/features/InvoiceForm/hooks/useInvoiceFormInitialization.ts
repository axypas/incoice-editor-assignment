/**
 * Hook for initializing invoice form with existing data or drafts
 * Handles conversion between API and form data formats
 */

import { useState, useEffect } from 'react'
import { UseFormReset } from 'react-hook-form'
import { Customer } from 'common/types'
import { Invoice } from 'common/types/invoice.types'
import { logger } from 'common/utils/logger'
import type { InvoiceFormValues, LineItemFormValue } from '../InvoiceForm'

/**
 * Creates a default empty line item
 */
const createDefaultLineItem = (): LineItemFormValue => ({
  product: null,
  product_id: undefined,
  label: '',
  quantity: 1,
  unit: 'piece',
  unit_price: 0,
  vat_rate: '0',
})

interface UseInvoiceFormInitializationParams {
  isEditMode: boolean
  invoiceId?: string
  existingInvoice?: Invoice | null
  reset: UseFormReset<InvoiceFormValues>
  restoreDraft: () => InvoiceFormValues | null
}

interface UseInvoiceFormInitializationReturn {
  isFormInitialized: boolean
}

/**
 * Converts invoice from API format to form format
 */
const convertInvoiceToFormValues = (invoice: Invoice): InvoiceFormValues => {
  // BE already has Customer with number ID, use directly
  const customerForForm: Customer | null = invoice.customer || null

  return {
    customer: customerForForm,
    date: invoice.date ? new Date(invoice.date) : null,
    deadline: invoice.deadline ? new Date(invoice.deadline) : null,
    finalized: false, // Always false for draft invoices being edited
    paid: invoice.paid || false,
    lineItems:
      invoice.invoice_lines && invoice.invoice_lines.length > 0
        ? invoice.invoice_lines.map(
            (line): LineItemFormValue => ({
              id: line.id.toString(), // Convert number to string for form
              product: line.product,
              product_id: line.product_id.toString(), // Convert number to string for form
              label: line.label,
              quantity: line.quantity,
              unit: line.unit,
              unit_price: parseFloat(line.price), // BE uses 'price' (string), parse to number
              vat_rate: String(line.vat_rate),
            })
          )
        : [createDefaultLineItem()],
  }
}

export const useInvoiceFormInitialization = ({
  isEditMode,
  invoiceId,
  existingInvoice,
  reset,
  restoreDraft,
}: UseInvoiceFormInitializationParams): UseInvoiceFormInitializationReturn => {
  const [isFormInitialized, setIsFormInitialized] = useState(false)

  // Initialize form with existing invoice data in edit mode
  useEffect(() => {
    if (!isEditMode || !existingInvoice || isFormInitialized) return

    try {
      // Check localStorage for draft first (unsaved changes)
      const draft = restoreDraft()
      if (draft && draft.lineItems.length > 0) {
        reset(draft)
        setIsFormInitialized(true)
        return
      }

      // Otherwise populate from existing invoice
      const formValues = convertInvoiceToFormValues(existingInvoice)
      reset(formValues)
      setIsFormInitialized(true)
    } catch (error) {
      logger.error('Failed to load invoice data:', error)
    }
  }, [isEditMode, existingInvoice, reset, isFormInitialized, restoreDraft])

  // Restore draft from localStorage in create mode
  useEffect(() => {
    if (isEditMode || isFormInitialized) return

    try {
      const draft = restoreDraft()

      // Always call reset to set default values (either from draft or fresh)
      if (!draft) {
        const defaultValues: InvoiceFormValues = {
          customer: null,
          date: new Date(),
          deadline: null,
          finalized: false,
          paid: false,
          lineItems: [createDefaultLineItem()],
        }
        reset(defaultValues)
        setIsFormInitialized(true)
        return
      }

      const restored: InvoiceFormValues = {
        ...draft,
        lineItems:
          draft.lineItems && draft.lineItems.length > 0
            ? draft.lineItems
            : [createDefaultLineItem()],
      }

      reset(restored)
      setIsFormInitialized(true)
    } catch (error) {
      setIsFormInitialized(true)
      logger.error('Failed to restore draft:', error)
    }
  }, [isEditMode, reset, isFormInitialized, restoreDraft])

  return {
    isFormInitialized,
  }
}
