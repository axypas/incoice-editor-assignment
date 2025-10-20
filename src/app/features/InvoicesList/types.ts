/**
 * Shared types for InvoicesList feature
 */

/**
 * Toast notification state for delete and finalize actions
 */
export interface ToastState {
  show: boolean
  message: string
  variant: 'success' | 'danger' | 'warning'
  invoiceId?: number
}

/**
 * Toast notification state for save actions
 */
export interface SaveToastState {
  show: boolean
  message: string
  invoiceId?: number
  isFinalized?: boolean
}
