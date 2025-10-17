/**
 * Tests for InvoicesList component (US1)
 * Covers: table display, sorting, formatting, states
 * Uses MSW to mock API responses
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { rest } from 'msw'
import { server } from 'test/server'
import { API_BASE } from 'test/constants'
import { ApiProvider } from '../../../api'
import InvoicesList from './index'

// Helper to render InvoicesList with ApiProvider
const renderInvoicesList = () => {
  return render(
    <ApiProvider url={API_BASE} token="test-token">
      <InvoicesList />
    </ApiProvider>
  )
}

// Sample invoice data
const mockInvoice = {
  id: 1,
  customer_id: 1,
  customer: {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    address: '123 Main St',
    zip_code: '12345',
    city: 'Paris',
  },
  finalized: false,
  paid: false,
  date: '2024-01-15',
  deadline: '2024-02-15',
  total: '1250.50',
  tax: '250.10',
  invoice_lines: [],
}

describe('InvoicesList - US1', () => {
  describe('Loading State', () => {
    it('shows loading indicator initially', () => {
      renderInvoicesList()
      expect(screen.getByText('Loading invoices...')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no invoices exist', async () => {
      renderInvoicesList()

      await waitFor(() => {
        expect(screen.getByText('No invoices yet')).toBeInTheDocument()
      })

      expect(
        screen.getByText('Create your first invoice to get started')
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /create invoice/i })
      ).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error message with retry button on API failure', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(ctx.status(500))
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(
          screen.getByText('Unable to load invoices. Please try again.')
        ).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('allows retry after error', async () => {
      let callCount = 0

      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          callCount++
          if (callCount === 1) {
            return res(ctx.status(500))
          }
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 25,
                total_pages: 1,
                total_entries: 0,
              },
              invoices: [],
            })
          )
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /retry/i })
        ).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /retry/i }))

      await waitFor(() => {
        expect(screen.getByText('No invoices yet')).toBeInTheDocument()
      })
    })
  })

  // TODO: Table display tests with MSW - requires fixing handler timing
  // These tests work when run individually but fail in suite due to MSW reset timing
  describe('Table Display with Data', () => {
    it('renders table with invoice data', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 25,
                total_pages: 1,
                total_entries: 1,
              },
              invoices: [mockInvoice],
            })
          )
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      // Check table structure
      expect(screen.getByText(/invoice #/i)).toBeInTheDocument()
      expect(screen.getByText(/customer/i)).toBeInTheDocument()
      expect(screen.getByText(/amount/i)).toBeInTheDocument()
      expect(screen.getByText(/status/i)).toBeInTheDocument()
      expect(screen.getByText(/actions/i)).toBeInTheDocument()
    })

    it('formats invoice number correctly', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 25,
                total_pages: 1,
                total_entries: 1,
              },
              invoices: [mockInvoice],
            })
          )
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(screen.getByText('INV-1')).toBeInTheDocument()
      })
    })

    it('displays customer name', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 25,
                total_pages: 1,
                total_entries: 1,
              },
              invoices: [mockInvoice],
            })
          )
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('formats currency amount correctly', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 25,
                total_pages: 1,
                total_entries: 1,
              },
              invoices: [mockInvoice],
            })
          )
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(screen.getByText(/1\s?250,50\s?€/)).toBeInTheDocument()
      })
    })

    it('shows Draft status badge for non-finalized invoice', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 25,
                total_pages: 1,
                total_entries: 1,
              },
              invoices: [mockInvoice],
            })
          )
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(screen.getByText('Draft')).toBeInTheDocument()
      })

      const badge = screen.getByText('Draft')
      expect(badge).toHaveClass('badge', 'bg-secondary')
    })

    it('shows appropriate action buttons for draft invoices', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 25,
                total_pages: 1,
                total_entries: 1,
              },
              invoices: [mockInvoice],
            })
          )
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument()
      })

      expect(screen.getByText('Finalize')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('shows View button for finalized invoices', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 25,
                total_pages: 1,
                total_entries: 1,
              },
              invoices: [{ ...mockInvoice, finalized: true }],
            })
          )
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(screen.getByText('View')).toBeInTheDocument()
      })

      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('sorts by date descending by default', async () => {
      const invoices = [
        { ...mockInvoice, id: 1, date: '2024-01-15' },
        { ...mockInvoice, id: 2, date: '2024-01-10' },
        { ...mockInvoice, id: 3, date: '2024-01-20' },
      ]

      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 25,
                total_pages: 1,
                total_entries: 3,
              },
              invoices,
            })
          )
        })
      )

      renderInvoicesList()

      // Wait for table and data to load
      await waitFor(() => {
        expect(screen.getByText('INV-1')).toBeInTheDocument()
      })
      expect(screen.getByRole('table')).toBeInTheDocument()

      // Verify rows are sorted by date descending (newest first)
      // initialState sorts the data but doesn't set visual indicator until user interaction
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBe(4) // 1 header + 3 data rows

      // Check dates appear in descending order (newest to oldest)
      expect(rows[1]).toHaveTextContent('INV-3')
      expect(rows[1]).toHaveTextContent('Jan 20, 2024')

      expect(rows[2]).toHaveTextContent('INV-1')
      expect(rows[2]).toHaveTextContent('Jan 15, 2024')

      expect(rows[3]).toHaveTextContent('INV-2')
      expect(rows[3]).toHaveTextContent('Jan 10, 2024')
    })

    it('sorts invoices when clicking column headers', async () => {
      // Use IDs in reverse order of dates to show sorting change
      const invoices = [
        { ...mockInvoice, id: 2, total: '500.00', date: '2024-01-15' },
        { ...mockInvoice, id: 1, total: '1000.00', date: '2024-01-20' },
      ]

      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 25,
                total_pages: 1,
                total_entries: 2,
              },
              invoices,
            })
          )
        })
      )

      renderInvoicesList()

      // Wait for table and data to load
      await waitFor(() => {
        expect(screen.getByText('INV-1')).toBeInTheDocument()
      })
      expect(screen.getByRole('table')).toBeInTheDocument()

      // Initially sorted by date desc: INV-1 (Jan 20) should come before INV-2 (Jan 15)
      let rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('INV-1')
      expect(rows[1]).toHaveTextContent('Jan 20, 2024')
      expect(rows[2]).toHaveTextContent('INV-2')
      expect(rows[2]).toHaveTextContent('Jan 15, 2024')

      // Find and click on Amount column header to sort by amount ascending
      const amountHeader = screen.getByRole('button', { name: /amount/i })
      await userEvent.click(amountHeader)

      // After clicking, should sort by amount ascending
      // INV-2 ($500) should come before INV-1 ($1000)
      await waitFor(() => {
        rows = screen.getAllByRole('row')
        // After sort by amount, INV-2 (500) comes first
        expect(rows[1]).toHaveTextContent('INV-2')
      })

      // Verify full sort order
      rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('INV-2')
      expect(rows[1]).toHaveTextContent('500')
      expect(rows[2]).toHaveTextContent('INV-1')
      expect(rows[2]).toHaveTextContent('1 000')
    })
  })

  describe('Edge Cases', () => {
    it('handles missing customer name with fallback', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 25,
                total_pages: 1,
                total_entries: 1,
              },
              invoices: [{ ...mockInvoice, customer: null }],
            })
          )
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(screen.getByText('—')).toBeInTheDocument()
      })
    })

    it('handles null dates with fallback', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 25,
                total_pages: 1,
                total_entries: 1,
              },
              invoices: [{ ...mockInvoice, date: null, deadline: null }],
            })
          )
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
      })
    })
  })
})
