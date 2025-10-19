/**
 * ToastNotifications component
 * Displays all toast notifications for the InvoicesList page
 * Includes: save success, delete, and finalize toasts
 */

import React from 'react'
import { Toast, ToastContainer } from 'react-bootstrap'

interface ToastState {
  show: boolean
  message: string
  variant: 'success' | 'danger' | 'warning'
}

interface SaveToastState {
  show: boolean
  message: string
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

const ToastNotifications: React.FC<ToastNotificationsProps> = ({
  deleteToast,
  onDeleteToastClose,
  finalizeToast,
  onFinalizeToastClose,
  saveToast,
  onSaveToastClose,
}) => {
  // Consolidate all toasts into a single array
  const toasts = [
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
    {
      ...saveToast,
      variant: 'success' as const,
      onClose: onSaveToastClose,
      key: 'save',
    },
  ]

  return (
    <ToastContainer position="top-end" className="p-3 z-50">
      {toasts.map((toast) => (
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
            {toast.message}
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  )
}

export default ToastNotifications
