/**
 * ToastNotifications component
 * Displays all toast notifications for the InvoicesList page
 * Includes: save success, delete, and finalize toasts
 */

import { Toast, ToastContainer } from 'react-bootstrap'
import { Link } from 'react-router-dom'

interface ToastState {
  show: boolean
  message: string
  variant: 'success' | 'danger' | 'warning'
  invoiceId?: number // BE uses number IDs
}

interface SaveToastState {
  show: boolean
  message: string
  invoiceId?: number // BE uses number IDs
  isFinalized?: boolean
}

interface ToastNotificationsProps {
  deleteToast: ToastState
  onDeleteToastClose: () => void
  finalizeToast: ToastState
  onFinalizeToastClose: () => void
  saveToast: SaveToastState
  onSaveToastClose: () => void
}

const getToastTitle = (variant: 'success' | 'danger' | 'warning'): string => {
  switch (variant) {
    case 'success':
      return 'Success'
    case 'warning':
      return 'Notice'
    case 'danger':
      return 'Error'
  }
}

const ToastNotifications = ({
  deleteToast,
  onDeleteToastClose,
  finalizeToast,
  onFinalizeToastClose,
  saveToast,
  onSaveToastClose,
}: ToastNotificationsProps) => {
  // Regular toasts without special content
  const regularToasts = [
    {
      ...deleteToast,
      onClose: onDeleteToastClose,
      key: 'delete',
    },
    {
      ...finalizeToast,
      onClose: onFinalizeToastClose,
      key: 'finalize',
    },
  ]

  return (
    <ToastContainer position="top-end" className="p-3 z-50">
      {regularToasts.map((toast) => (
        <Toast
          key={toast.key}
          show={toast.show}
          onClose={toast.onClose}
          delay={5000}
          autohide
          bg={toast.variant}
        >
          <Toast.Header>
            <strong className="me-auto">{getToastTitle(toast.variant)}</strong>
          </Toast.Header>
          <Toast.Body
            className={toast.variant === 'success' ? 'text-white' : ''}
          >
            <div>{toast.message}</div>
            {toast.invoiceId && toast.variant === 'success' && (
              <Link
                to={`/invoice/${toast.invoiceId}`}
                className="text-white text-decoration-underline d-block mt-2"
              >
                View invoice
              </Link>
            )}
          </Toast.Body>
        </Toast>
      ))}

      {/* Save toast with optional link to invoice */}
      <Toast
        show={saveToast.show}
        onClose={onSaveToastClose}
        delay={5000}
        autohide
        bg="success"
      >
        <Toast.Header>
          <strong className="me-auto">Success</strong>
        </Toast.Header>
        <Toast.Body className="text-white">
          <div>{saveToast.message}</div>
          {saveToast.invoiceId && (
            <Link
              to={
                saveToast.isFinalized
                  ? `/invoice/${saveToast.invoiceId}`
                  : `/invoices/${saveToast.invoiceId}/edit`
              }
              className="text-white text-decoration-underline d-block mt-2"
            >
              View invoice
            </Link>
          )}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  )
}

export default ToastNotifications
