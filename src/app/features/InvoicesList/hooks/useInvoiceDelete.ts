/**
 * Hook for managing invoice deletion
 * Handles delete dialog state, confirmation, error handling, and toast notifications
 */

import { useState, useCallback } from 'react'
import { Invoice } from 'common/types/invoice.types'
import { useApi } from 'api'

interface ToastState {
  show: boolean
  message: string
  variant: 'success' | 'danger' | 'warning'
}

interface UseInvoiceDeleteReturn {
  invoiceToDelete: Invoice | null
  showDeleteDialog: boolean
  isDeleting: boolean
  toastState: ToastState
  liveRegionMessage: string
  handleDeleteClick: (invoice: Invoice) => void
  handleDeleteConfirm: () => Promise<void>
  handleDeleteCancel: () => void
  setToastShow: (show: boolean) => void
}

export const useInvoiceDelete = (
  refetchInvoices: () => void
): UseInvoiceDeleteReturn => {
  const api = useApi()

  // Delete state
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast state
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastVariant, setToastVariant] = useState<
    'success' | 'danger' | 'warning'
  >('success')

  // Live region for accessibility announcements
  const [liveRegionMessage, setLiveRegionMessage] = useState('')

  // Helper to show toast notifications
  const showToastNotification = useCallback(
    (message: string, variant: 'success' | 'danger' | 'warning') => {
      setToastMessage(message)
      setToastVariant(variant)
      setShowToast(true)
    },
    []
  )

  // Handle delete button click
  const handleDeleteClick = useCallback((invoice: Invoice) => {
    setInvoiceToDelete(invoice)
    setShowDeleteDialog(true)
  }, [])

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!invoiceToDelete) return

    setIsDeleting(true)

    // Save invoice number before clearing state
    const invoiceNumber = invoiceToDelete.invoice_number

    try {
      // Call delete API
      await api.deleteInvoice(invoiceToDelete.id)

      // Success: show success messages first (before clearing state)
      showToastNotification(
        `Invoice #${invoiceNumber} has been deleted`,
        'success'
      )

      // Announce to screen readers
      setLiveRegionMessage(`Invoice #${invoiceNumber} deleted successfully`)

      // Then close dialog and clear state
      setShowDeleteDialog(false)
      setInvoiceToDelete(null)

      // Refetch invoices to update the list
      refetchInvoices()
    } catch (err: any) {
      console.error('Failed to delete invoice:', err)

      // Handle specific error cases based on HTTP status
      const status = err?.response?.status

      if (status === 404) {
        // Invoice was already deleted
        showToastNotification(
          'This invoice has already been deleted',
          'warning'
        )
        setLiveRegionMessage('Invoice was already deleted')
        setShowDeleteDialog(false)
        setInvoiceToDelete(null)
        refetchInvoices() // Refresh to remove from UI
      } else if (status === 403 || status === 409) {
        // Invoice is finalized or cannot be deleted
        showToastNotification('Cannot delete finalized invoice', 'danger')
        setLiveRegionMessage('Cannot delete finalized invoice')
        setShowDeleteDialog(false)
        setInvoiceToDelete(null)
        refetchInvoices() // Refresh to get updated state
      } else {
        // Generic error
        showToastNotification(
          'Failed to delete invoice. Please try again.',
          'danger'
        )
        setLiveRegionMessage('Failed to delete invoice')
      }
    } finally {
      setIsDeleting(false)
    }
  }, [invoiceToDelete, api, refetchInvoices, showToastNotification])

  // Handle delete cancel
  const handleDeleteCancel = useCallback(() => {
    setShowDeleteDialog(false)
    setInvoiceToDelete(null)
  }, [])

  return {
    invoiceToDelete,
    showDeleteDialog,
    isDeleting,
    toastState: {
      show: showToast,
      message: toastMessage,
      variant: toastVariant,
    },
    liveRegionMessage,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    setToastShow: setShowToast,
  }
}
