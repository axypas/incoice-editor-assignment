import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from './ErrorBoundary'

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>No error</div>
}

// Suppress console.error for these tests since we're intentionally throwing errors
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalError
})

describe('ErrorBoundary', () => {
  describe('happy path', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('renders children normally before error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('displays fallback UI when child component throws error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(
        screen.getByText(/We encountered an unexpected error/)
      ).toBeInTheDocument()
    })

    it('displays error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(process.env as any).NODE_ENV = 'development'

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(
        screen.getByText('Error details (development only)')
      ).toBeInTheDocument()
      expect(screen.getByText(/Test error message/)).toBeInTheDocument()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(process.env as any).NODE_ENV = originalEnv
    })

    it('hides error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(process.env as any).NODE_ENV = 'production'

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(
        screen.queryByText('Error details (development only)')
      ).not.toBeInTheDocument()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(process.env as any).NODE_ENV = originalEnv
    })

    it('shows Try Again button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(
        screen.getByRole('button', { name: /try again/i })
      ).toBeInTheDocument()
    })

    it('resets error state when Try Again is clicked', async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Error boundary should show
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // First, fix the component so it doesn't throw anymore
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      // Error should still be showing because boundary hasn't reset
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Click Try Again to reset the boundary
      await userEvent.click(screen.getByRole('button', { name: /try again/i }))

      // Should show normal content now
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('calls onError callback when error occurs', () => {
      const onError = jest.fn()

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error message',
        }),
        expect.any(String)
      )
    })
  })

  describe('custom fallback', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = (error: Error) => (
        <div>
          <h1>Custom Error UI</h1>
          <p>Error: {error.message}</p>
        </div>
      )

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
      expect(screen.getByText(/Error: Test error message/)).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('provides reset function to custom fallback', async () => {
      const customFallback = (
        _error: Error,
        _errorInfo: string,
        reset: () => void
      ) => <button onClick={reset}>Reset Custom</button>

      const { rerender } = render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Reset Custom')).toBeInTheDocument()

      // First fix the component so it won't throw
      rerender(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      // Error still showing because boundary hasn't reset
      expect(screen.getByText('Reset Custom')).toBeInTheDocument()

      // Click reset
      await userEvent.click(screen.getByText('Reset Custom'))

      // Should show normal content now
      expect(screen.queryByText('Reset Custom')).not.toBeInTheDocument()
      expect(screen.getByText('No error')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('uses alert role for error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveClass('alert', 'alert-danger')
    })

    it('displays heading with error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Verify the heading is accessible and contains the error message
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('has accessible button with icon and text', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const button = screen.getByRole('button', { name: /try again/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('btn', 'btn-primary')
    })
  })

  describe('user empathy - preserve data and clear messaging', () => {
    it('displays reassuring message about data preservation', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(
        screen.getByText(/Your data has been preserved/)
      ).toBeInTheDocument()
    })

    it('provides clear call to action', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/you can try again/)).toBeInTheDocument()
    })
  })
})
