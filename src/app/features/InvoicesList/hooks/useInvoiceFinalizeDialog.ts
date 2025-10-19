/**
 * Hook for managing invoice finalize dialog and toast notifications
 * Handles finalize click, confirmation, and success/error toasts
 */

import { useState, useCallback } from 'react'
import { Invoice } from 'common/types/invoice.types'
import { useInvoiceFinalize } from './useInvoiceFinalize'

interface ToastState {
  show: boolean
  message: string
  variant: 'success' | 'danger'
}

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
      await finalizeInvoice(invoiceToFinalize.id || '')
      setShowFinalizeDialog(false)
      setInvoiceToFinalize(null)

      // Show success toast
      setFinalizeToast({
        show: true,
        message: 'Invoice finalized successfully',
        variant: 'success',
      })

      // Refresh invoices list
      refetchInvoices()
    } catch (err) {
      // Error toast
      setFinalizeToast({
        show: true,
        message: 'Failed to finalize invoice. Please try again.',
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
