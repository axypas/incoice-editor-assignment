/**
 * LoadingState component
 * Displays a loading spinner with message
 * Reusable across invoice-related features
 */

import React from 'react'
import { Spinner } from 'react-bootstrap'

interface LoadingStateProps {
  message?: string
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading invoice...',
}) => {
  return (
    <div className="d-flex justify-content-center align-items-center mt-5 py-5">
      <Spinner animation="border" role="status" className="me-2">
        <span className="visually-hidden">{message}</span>
      </Spinner>
      <span>{message}</span>
    </div>
  )
}

export default LoadingState
