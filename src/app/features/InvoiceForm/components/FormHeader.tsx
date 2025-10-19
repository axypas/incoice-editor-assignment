/**
 * FormHeader component
 * Displays form title, invoice number, and auto-save status
 */

import React from 'react'
import { Alert, Spinner } from 'react-bootstrap'

interface FormHeaderProps {
  isEditMode: boolean
  invoiceNumber?: string
  invoiceId?: string
  isAutoSaving: boolean
  lastSaved: Date | null
  saveError: string | null
  submitError: string | null
  onDismissSubmitError: () => void
}

const FormHeader: React.FC<FormHeaderProps> = ({
  isEditMode,
  invoiceNumber,
  invoiceId,
  isAutoSaving,
  lastSaved,
  saveError,
  submitError,
  onDismissSubmitError,
}) => {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{isEditMode ? 'Edit Invoice' : 'Create Invoice'}</h2>
        {isEditMode && (
          <span className="text-muted">
            Invoice #{invoiceNumber || invoiceId}
          </span>
        )}
      </div>

      {(isAutoSaving || lastSaved || saveError) && (
        <Alert variant={saveError ? 'warning' : 'info'} className="mb-3">
          {isAutoSaving && (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Saving draft...
            </>
          )}
          {!isAutoSaving && lastSaved && !saveError && (
            <>
              Draft saved at{' '}
              {lastSaved.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </>
          )}
          {saveError && <>{saveError}</>}
        </Alert>
      )}

      {submitError && (
        <Alert variant="danger" dismissible onClose={onDismissSubmitError}>
          {submitError}
        </Alert>
      )}
    </>
  )
}

export default FormHeader
