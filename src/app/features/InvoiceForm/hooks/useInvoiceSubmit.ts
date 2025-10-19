/**
 * useInvoiceSubmit hook
 * Handles invoice creation and update logic
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { UseFormSetError } from 'react-hook-form'
import { useApi } from 'api'
import { useUpdateInvoice } from 'app/features/InvoicesList/hooks/useInvoices'
import type { Customer, Product } from 'common/types'
import type { Invoice } from 'common/types/invoice.types'

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

interface InvoiceFormValues {
  customer: Customer | null
  date: Date | null
  deadline: Date | null
  paid: boolean
  lineItems: LineItemFormValue[]
}

interface UseInvoiceSubmitOptions {
  isEditMode: boolean
  invoiceId?: string
  existingInvoice?: Invoice
  setError: UseFormSetError<InvoiceFormValues>
  onSuccess?: () => void
  shouldFinalize?: boolean
}

interface UseInvoiceSubmitReturn {
  submitError: string | null
  setSubmitError: (error: string | null) => void
  handleSubmit: (values: InvoiceFormValues) => Promise<void>
}

export const useInvoiceSubmit = ({
  isEditMode,
  invoiceId,
  existingInvoice,
  setError,
  onSuccess,
  shouldFinalize = false,
}: UseInvoiceSubmitOptions): UseInvoiceSubmitReturn => {
  const navigate = useNavigate()
  const api = useApi()
  const { updateInvoice } = useUpdateInvoice()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (values: InvoiceFormValues) => {
      setSubmitError(null)

      try {
        if (!values.customer) {
          setError('customer', {
            type: 'manual',
            message: 'Please select a customer',
          })
          return
        }

        if (!values.date) {
          setError('date', {
            type: 'manual',
            message: 'Invoice date is required',
          })
          return
        }

        if (isEditMode && invoiceId) {
          // Edit mode: Build update payload with invoice_lines_attributes
          const originalLineIds = new Set(
            existingInvoice?.invoice_lines
              ?.map((line) => line.id)
              .filter(Boolean) || []
          )
          const updatedLineIds = new Set(
            values.lineItems
              .map((item) => item.id)
              .filter((id): id is string => !!id)
          )

          const invoice_lines_attributes = [
            // Update or create line items
            ...values.lineItems.map((item) => {
              if (item.id) {
                // Update existing line
                return {
                  id: parseInt(item.id, 10),
                  product_id: item.product_id
                    ? parseInt(item.product_id, 10)
                    : undefined,
                  quantity: item.quantity,
                  label: item.label,
                }
              } else {
                // Create new line
                if (!item.product_id) {
                  throw new Error('Missing product for new line item')
                }
                return {
                  product_id: parseInt(item.product_id, 10),
                  quantity: item.quantity,
                }
              }
            }),
            // Delete removed lines
            ...Array.from(originalLineIds)
              .filter(
                (id): id is string =>
                  typeof id === 'string' && !updatedLineIds.has(id)
              )
              .map((id) => ({
                id: parseInt(id, 10),
                _destroy: true,
              })),
          ]

          const updatePayload = {
            id: parseInt(invoiceId, 10),
            customer_id: values.customer.id,
            date: values.date.toISOString().split('T')[0],
            deadline: values.deadline
              ? values.deadline.toISOString().split('T')[0]
              : null,
            paid: values.paid,
            finalized: shouldFinalize,
            invoice_lines_attributes,
          }

          await updateInvoice(invoiceId, updatePayload as any)
          onSuccess?.()
          navigate('/')
        } else {
          // Create mode
          const invoice_lines_attributes = values.lineItems.map((item, idx) => {
            if (!item.product_id) {
              throw new Error(`Missing product for line item ${idx + 1}`)
            }
            return {
              product_id: parseInt(item.product_id, 10),
              quantity: item.quantity,
            }
          })

          const invoiceData = {
            customer_id: values.customer.id,
            date: values.date.toISOString().split('T')[0],
            deadline: values.deadline
              ? values.deadline.toISOString().split('T')[0]
              : null,
            invoice_lines_attributes,
            finalized: shouldFinalize,
            paid: values.paid,
          }

          await api.postInvoices(null, { invoice: invoiceData })
          onSuccess?.()
          navigate('/')
        }
      } catch (error: any) {
        if (error.response?.status === 422) {
          const serverErrors: Record<string, unknown> =
            error.response.data?.errors || {}
          Object.entries(serverErrors).forEach(([field, message]) => {
            const rawMessage = Array.isArray(message)
              ? message
                  .filter((entry): entry is string => typeof entry === 'string')
                  .join(', ')
              : message
            const errorMessage =
              typeof rawMessage === 'string' && rawMessage.trim().length > 0
                ? rawMessage
                : 'Unexpected validation error'

            if (field === 'customer') {
              setError('customer', { type: 'server', message: errorMessage })
            } else if (field === 'date') {
              setError('date', { type: 'server', message: errorMessage })
            } else if (field === 'deadline') {
              setError('deadline', { type: 'server', message: errorMessage })
            } else if (field.startsWith('lineItems')) {
              const [, indexStr, key] = field.split('.')
              const lineIndex = Number(indexStr)
              if (!Number.isNaN(lineIndex)) {
                setError(
                  `lineItems.${lineIndex}.${key}` as any,
                  {
                    type: 'server',
                    message: errorMessage,
                  },
                  { shouldFocus: false }
                )
              }
            }
          })

          setSubmitError('Please fix the validation errors and try again.')
        } else if (error.response?.status === 409) {
          // Concurrent edit conflict
          setSubmitError(
            'This invoice was updated by someone else. Please refresh and try again.'
          )
        } else {
          setSubmitError(
            `Unable to ${
              isEditMode ? 'update' : 'create'
            } invoice. Please check your connection and try again.`
          )
        }
        console.error(
          `Invoice ${isEditMode ? 'update' : 'creation'} error:`,
          error
        )
      }
    },
    [
      api,
      setError,
      navigate,
      isEditMode,
      invoiceId,
      updateInvoice,
      existingInvoice,
      onSuccess,
      shouldFinalize,
    ]
  )

  return {
    submitError,
    setSubmitError,
    handleSubmit,
  }
}
