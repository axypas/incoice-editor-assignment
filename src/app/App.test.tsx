/**
 * Tests for App component (US0 - API health check)
 * Covers: loading state, auth error, connection error, success state
 * Uses MSW to mock network requests
 */

import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { ApiProvider } from '../api'
import App from './App'

const API_BASE = 'https://jean-test-api.herokuapp.com'

// Helper to render App with ApiProvider
const renderApp = () => {
  return render(
    <ApiProvider url={API_BASE} token="test-token">
      <App />
    </ApiProvider>
  )
}

describe('App - API Health Check (US0)', () => {
  describe('Success State (Happy Path)', () => {
    it('renders invoice list when API is healthy', async () => {
      // Default MSW handler returns 200 with empty invoices
      renderApp()

      // Wait for API call to complete and app to render
      await waitFor(() => {
        expect(
          screen.getByText(/This is the initial application/i)
        ).toBeInTheDocument()
      })

      // With empty invoices, should show empty state (not a table)
      await waitFor(() => {
        expect(screen.getByText('No invoices yet')).toBeInTheDocument()
      })
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('does not show error states when healthy', async () => {
      renderApp()

      // Wait for API call to complete
      await waitFor(() => {
        expect(
          screen.getByText(/This is the initial application/i)
        ).toBeInTheDocument()
      })

      // Wait for InvoicesList to finish loading
      await waitFor(() => {
        expect(screen.getByText('No invoices yet')).toBeInTheDocument()
      })

      expect(screen.queryByText('Authentication Error')).not.toBeInTheDocument()
      expect(screen.queryByText('Connection Error')).not.toBeInTheDocument()
    })
  })

  describe('Authentication Error State', () => {
    it('shows authentication error with actionable instructions', async () => {
      // Mock 401 Unauthorized response
      server.use(
        http.get(`${API_BASE}/invoices`, () => {
          return new HttpResponse(null, {
            status: 401,
            statusText: 'Unauthorized',
          })
        })
      )

      renderApp()

      // Wait for error state to appear
      await waitFor(() => {
        expect(screen.getByText('Authentication Error')).toBeInTheDocument()
      })

      expect(
        screen.getByText('Authentication failed. Please check your API token.')
      ).toBeInTheDocument()

      // Verify actionable instructions are present
      expect(screen.getByText(/How to fix:/)).toBeInTheDocument()
      expect(screen.getByText('.env.template')).toBeInTheDocument()
      expect(screen.getAllByText('.env.local').length).toBeGreaterThan(0)
      expect(screen.getByText('REACT_APP_API_TOKEN')).toBeInTheDocument()
      expect(
        screen.getByText(/Find the token in the repository description/)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Restart the development server/)
      ).toBeInTheDocument()
    })

    it('does not render invoice list on auth error', async () => {
      // Mock 403 Forbidden response
      server.use(
        http.get(`${API_BASE}/invoices`, () => {
          return new HttpResponse(null, {
            status: 403,
            statusText: 'Forbidden',
          })
        })
      )

      renderApp()

      await waitFor(() => {
        expect(screen.getByText('Authentication Error')).toBeInTheDocument()
      })

      expect(screen.queryByRole('table')).not.toBeInTheDocument()
      expect(
        screen.queryByText(/This is the initial application/i)
      ).not.toBeInTheDocument()
    })
  })

  describe('Connection Error State', () => {
    it('shows connection error without auth instructions', async () => {
      // Mock network error
      server.use(
        http.get(`${API_BASE}/invoices`, () => {
          return HttpResponse.error()
        })
      )

      renderApp()

      await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument()
      })

      expect(
        screen.getByText(
          'Unable to connect to the API. Please check your network connection.'
        )
      ).toBeInTheDocument()

      // Should NOT show auth-specific instructions
      expect(screen.queryByText(/How to fix:/)).not.toBeInTheDocument()
    })

    it('shows connection error for 500 server error', async () => {
      // Mock 500 Internal Server Error
      server.use(
        http.get(`${API_BASE}/invoices`, () => {
          return new HttpResponse(null, {
            status: 500,
            statusText: 'Internal Server Error',
          })
        })
      )

      renderApp()

      await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument()
      })

      expect(
        screen.getByText(
          'Unable to connect to the API. Please check your network connection.'
        )
      ).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('loading state has proper ARIA role', () => {
      renderApp()

      const loadingAlert = screen.getByRole('status')
      expect(loadingAlert).toHaveClass('alert', 'alert-info')
    })

    it('error state has proper ARIA role', async () => {
      server.use(
        http.get(`${API_BASE}/invoices`, () => {
          return new HttpResponse(null, { status: 401 })
        })
      )

      renderApp()

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toHaveClass('alert', 'alert-danger')
      })
    })
  })
})
