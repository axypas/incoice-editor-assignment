/**
 * FormActions component
 * Displays cancel and submit buttons with loading states
 */

import React from 'react'
import { Button, Spinner } from 'react-bootstrap'

interface FormActionsProps {
  isEditMode: boolean
  isSubmitting: boolean
  isUpdating: boolean
  hasValidationErrors: boolean
  onCancel: () => void
  onFinalizeClick: () => void
}

const FormActions = ({
  isEditMode,
  isSubmitting,
  isUpdating,
  hasValidationErrors,
  onCancel,
  onFinalizeClick,
}: FormActionsProps): JSX.Element => {
  const isBusy = isSubmitting || isUpdating

  return (
    <div className="d-flex justify-content-end gap-2">
      <Button variant="outline-dark" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        variant="primary"
        type="submit"
        disabled={isBusy || hasValidationErrors}
        aria-busy={isBusy}
      >
        {isBusy ? (
          <>
            <Spinner
              animation="border"
              size="sm"
              className="me-2"
              role="status"
              aria-hidden="true"
            />
            {isEditMode ? 'Updating...' : 'Creating...'}
          </>
        ) : isEditMode ? (
          'Save Changes'
        ) : (
          'Create Invoice'
        )}
      </Button>
      <Button
        variant="success"
        onClick={onFinalizeClick}
        disabled={isBusy || hasValidationErrors}
      >
        {isEditMode
          ? 'Save and Finalize Invoice'
          : 'Create and Finalize Invoice'}
      </Button>
    </div>
  )
}

export default FormActions
