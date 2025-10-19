/**
 * Tests for App component (US0 - API health check)
 * Covers: loading state, auth error, connection error, success state
 * Uses MSW to mock network requests
 */

import { render, screen, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import { server } from 'common/test/server'
import { API_BASE } from 'common/test/constants'
import { ApiProvider } from '../api'
import App from './App'

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

      // With empty invoices, should show empty state (not a table)
      await waitFor(() => {
        expect(screen.getByText('No invoices yet')).toBeInTheDocument()
      })
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('does not show error states when healthy', async () => {
      renderApp()

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
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(ctx.status(401))
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
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(ctx.status(403))
        })
      )

      renderApp()

      await waitFor(() => {
        expect(screen.getByText('Authentication Error')).toBeInTheDocument()
      })

      expect(screen.queryByRole('table')).not.toBeInTheDocument()
      expect(screen.queryByText('No invoices yet')).not.toBeInTheDocument()
    })
  })

  describe('Connection Error State', () => {
    it('shows connection error without auth instructions', async () => {
      // Mock network error
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(ctx.status(500))
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
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(ctx.status(500))
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
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(ctx.status(401))
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
