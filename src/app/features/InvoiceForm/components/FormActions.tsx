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
}

const FormActions: React.FC<FormActionsProps> = ({
  isEditMode,
  isSubmitting,
  isUpdating,
  hasValidationErrors,
  onCancel,
}) => {
  return (
    <div className="d-flex justify-content-end gap-2">
      <Button
        variant="outline-secondary"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        type="submit"
        disabled={isSubmitting || isUpdating || hasValidationErrors}
      >
        {isSubmitting || isUpdating ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            {isEditMode ? 'Updating...' : 'Creating...'}
          </>
        ) : isEditMode ? (
          'Save Changes'
        ) : (
          'Create Invoice'
        )}
      </Button>
    </div>
  )
}

export default FormActions
