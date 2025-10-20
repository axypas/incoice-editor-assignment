/**
 * Hook for managing invoice finalize dialog and toast notifications
 * Handles finalize click, confirmation, and success/error toasts
 */

import { useState, useCallback } from 'react'
import { Invoice } from 'common/types/invoice.types'
import { useInvoiceFinalize } from './useInvoiceFinalize'
import { parseApiError } from 'common/utils/apiErrorParser'
import { ToastState } from '../types'

interface UseInvoiceFinalizeDialogReturn {
  invoiceToFinalize: Invoice | null
  showFinalizeDialog: boolean
  isFinalizing: boolean
  finalizeToast: ToastState
  handleFinalizeClick: (invoice: Invoice) => void
  handleFinalizeConfirm: () => Promise<void>
  handleFinalizeCancel: () => void
  setFinalizeToast: (toast: ToastState) => void
}

export const useInvoiceFinalizeDialog = (
  refetchInvoices: () => void
): UseInvoiceFinalizeDialogReturn => {
  const [invoiceToFinalize, setInvoiceToFinalize] = useState<Invoice | null>(
    null
  )
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)
  const [finalizeToast, setFinalizeToast] = useState<ToastState>({
    show: false,
    message: '',
    variant: 'success',
  })
  const { finalizeInvoice, isFinalizing } = useInvoiceFinalize()

  const handleFinalizeClick = useCallback((invoice: Invoice) => {
    setInvoiceToFinalize(invoice)
    setShowFinalizeDialog(true)
  }, [])

  const handleFinalizeConfirm = useCallback(async () => {
    if (!invoiceToFinalize) return

    try {
      // BE invoice.id is number
      await finalizeInvoice(invoiceToFinalize.id)
      setShowFinalizeDialog(false)

      // Show success toast with invoice ID for link
      setFinalizeToast({
        show: true,
        message: 'Invoice finalized successfully',
        variant: 'success',
        invoiceId: invoiceToFinalize.id,
      })

      setInvoiceToFinalize(null)

      // Refresh invoices list
      refetchInvoices()
    } catch (err) {
      // Parse API error for better messaging
      const apiError = parseApiError(err, 'Failed to finalize invoice')

      // Error toast with parsed message
      setFinalizeToast({
        show: true,
        message: apiError.message,
        variant: 'danger',
      })
    }
  }, [invoiceToFinalize, finalizeInvoice, refetchInvoices])

  const handleFinalizeCancel = useCallback(() => {
    setShowFinalizeDialog(false)
    setInvoiceToFinalize(null)
  }, [])

  return {
    invoiceToFinalize,
    showFinalizeDialog,
    isFinalizing,
    finalizeToast,
    handleFinalizeClick,
    handleFinalizeConfirm,
    handleFinalizeCancel,
    setFinalizeToast,
  }
}
