/**
 * ErrorState component
 * Displays error message with optional action button
 * Reusable across invoice-related features
 */

import React from 'react'
import { Alert, Button } from 'react-bootstrap'

interface ErrorStateProps {
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error Loading Invoice',
  message = 'Unable to load invoice. Please try again later.',
  actionLabel = 'Back to List',
  onAction,
}) => {
  return (
    <Alert variant="danger" className="mt-4">
      <Alert.Heading>{title}</Alert.Heading>
      <p>{message}</p>
      {onAction && (
        <Button variant="outline-danger" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Alert>
  )
}

export default ErrorState
