/**
 * Hook for managing save success toast notifications in InvoicesList
 * Reads success message from navigation state and displays toast
 */

import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface SaveToastState {
  show: boolean
  message: string
  invoiceId?: string
  isFinalized?: boolean
}

interface UseInvoiceListToastsReturn {
  saveToast: SaveToastState
  setSaveToast: (toast: SaveToastState) => void
}

export const useInvoiceListToasts = (): UseInvoiceListToastsReturn => {
  const location = useLocation()
  const navigate = useNavigate()

  // Save success toast (from navigation state)
  const [saveToast, setSaveToast] = useState<SaveToastState>({
    show: false,
    message: '',
    invoiceId: undefined,
    isFinalized: false,
  })

  // Check for success message from navigation state
  useEffect(() => {
    const state = location.state as {
      successMessage?: string
      invoiceId?: string
      isFinalized?: boolean
    } | null
    if (state?.successMessage) {
      setSaveToast({
        show: true,
        message: state.successMessage,
        invoiceId: state.invoiceId,
        isFinalized: state.isFinalized,
      })
      // Clear the state to prevent showing toast again on page refresh
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  return {
    saveToast,
    setSaveToast,
  }
}
