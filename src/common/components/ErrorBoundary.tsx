import { Component, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, errorInfo: string, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: string) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
}

/**
 * ErrorBoundary component to catch and handle errors in child components
 *
 * Features:
 * - Catches rendering errors in child components
 * - Displays user-friendly fallback UI
 * - Logs errors to console in development
 * - Provides reset functionality to retry rendering
 * - Customizable fallback UI via props
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
    const errorInfoString = errorInfo.componentStack

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught an error:', error)
      console.error('Component stack:', errorInfoString)
    }

    this.setState({
      errorInfo: errorInfoString,
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfoString)
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo || '', this.resetErrorBoundary)
      }

      // Default fallback UI
      return (
        <div className="container mt-5">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Something went wrong
            </h4>
            <p className="mb-3">
              We encountered an unexpected error. Your data has been preserved,
              and you can try again.
            </p>

            {process.env.NODE_ENV !== 'production' && error && (
              <div className="mt-3">
                <details className="small">
                  <summary className="mb-2" style={{ cursor: 'pointer' }}>
                    <strong>Error details (development only)</strong>
                  </summary>
                  <div className="bg-light p-3 rounded">
                    <pre className="mb-2 text-danger">
                      <code>{error.toString()}</code>
                    </pre>
                    {errorInfo && (
                      <pre
                        className="mb-0 text-muted"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <code>{errorInfo}</code>
                      </pre>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="mt-3">
              <button
                type="button"
                className="btn btn-primary"
                onClick={this.resetErrorBoundary}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Try Again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return children
  }
}

export default ErrorBoundary
