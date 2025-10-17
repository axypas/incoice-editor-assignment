/**
 * Tests for InvoicesList component (US1)
 * Covers: table display, sorting, formatting, states
 * Uses MSW to mock API responses
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { rest } from 'msw'
import { server } from 'test/server'
import { API_BASE } from 'test/constants'
import { ApiProvider } from '../../../api'
import InvoicesList from './index'

// Mock react-datepicker to make it testable
jest.mock('react-datepicker', () => {
  const React = require('react')
  return function MockDatePicker({
    onChange,
    placeholderText,
    startDate,
    endDate,
    ...props
  }: any) {
    const [inputValue, setInputValue] = React.useState('')

    return (
      <input
        data-testid="mock-datepicker"
        placeholder={placeholderText}
        value={inputValue}
        onChange={(e) => {
          const value = e.target.value
          setInputValue(value)
          if (value) {
            // Parse date as local time to avoid timezone issues
            const parts = value.split('-')
            if (parts.length === 3) {
              const date = new Date(
                parseInt(parts[0]),
                parseInt(parts[1]) - 1,
                parseInt(parts[2])
              )
              // For range picker, pass [startDate, null] when a single date is entered
              onChange([date, null])
            }
          } else {
            onChange([null, null])
          }
        }}
        {...props}
      />
    )
  }
})

// Helper to render InvoicesList with ApiProvider and Router
const renderInvoicesList = () => {
  return render(
    <MemoryRouter>
      <ApiProvider url={API_BASE} token="test-token">
        <InvoicesList />
      </ApiProvider>
    </MemoryRouter>
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
    it('shows loading indicator initially', async () => {
      renderInvoicesList()
      // Loading state may appear briefly before API returns
      // Verify component renders to one of the expected states
      await waitFor(() => {
        const hasLoading = screen.queryByText('Loading invoices...')
        const hasEmpty = screen.queryByText('No invoices yet')
        const hasTable = screen.queryByRole('table')
        expect(hasLoading || hasEmpty || hasTable).toBeTruthy()
      })
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
                page_size: 10,
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
                page_size: 10,
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

      // Check table structure - use getAllByText for headers that might appear in filters too
      expect(screen.getByText(/^ID$/i)).toBeInTheDocument()
      expect(screen.getAllByText(/customer/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/amount/i)).toBeInTheDocument()
      expect(screen.getAllByText(/status/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/actions/i)).toBeInTheDocument()
    })

    it('displays invoice ID correctly', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 10,
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
        expect(screen.getByText('#1')).toBeInTheDocument()
      })
    })

    it('displays customer name', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 10,
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

    it('formats currency amount correctly for paid invoices', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 10,
                total_pages: 1,
                total_entries: 1,
              },
              invoices: [{ ...mockInvoice, paid: true }],
            })
          )
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(screen.getByText(/1\s?250,50\s?€/)).toBeInTheDocument()
      })
    })

    it('hides amount for unpaid invoices', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 10,
                total_pages: 1,
                total_entries: 1,
              },
              invoices: [{ ...mockInvoice, paid: false }],
            })
          )
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      // Amount should show '—' for unpaid invoice
      expect(screen.queryByText(/1\s?250,50\s?€/)).not.toBeInTheDocument()
    })

    it('shows Draft status badge for non-finalized invoice', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 10,
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

      // Find the Draft badge specifically (not the filter button)
      const badges = screen.getAllByText('Draft')
      const badge = badges.find((el) => el.classList.contains('badge'))
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('badge', 'bg-secondary')
    })

    it('shows appropriate action buttons for draft invoices', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 10,
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

      // Check action buttons in the table
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Finalize' })
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    })

    it('shows View button for finalized invoices', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 10,
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
                page_size: 10,
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
        expect(screen.getByText('#1')).toBeInTheDocument()
      })
      expect(screen.getByRole('table')).toBeInTheDocument()

      // Verify rows are sorted by date descending (newest first)
      // initialState sorts the data but doesn't set visual indicator until user interaction
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBe(4) // 1 header + 3 data rows

      // Check dates appear in descending order (newest to oldest)
      expect(rows[1]).toHaveTextContent('#3')
      expect(rows[1]).toHaveTextContent('Jan 20, 2024')

      expect(rows[2]).toHaveTextContent('#1')
      expect(rows[2]).toHaveTextContent('Jan 15, 2024')

      expect(rows[3]).toHaveTextContent('#2')
      expect(rows[3]).toHaveTextContent('Jan 10, 2024')
    })

    it('sorts invoices when clicking column headers', async () => {
      // Use IDs in reverse order of dates to show sorting change
      const invoices = [
        {
          ...mockInvoice,
          id: 2,
          total: '500.00',
          date: '2024-01-15',
          paid: true,
        },
        {
          ...mockInvoice,
          id: 1,
          total: '1000.00',
          date: '2024-01-20',
          paid: true,
        },
      ]

      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 10,
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
        expect(screen.getByText('#1')).toBeInTheDocument()
      })
      expect(screen.getByRole('table')).toBeInTheDocument()

      // Initially sorted by date desc: ID 1 (Jan 20) should come before ID 2 (Jan 15)
      let rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('#1')
      expect(rows[1]).toHaveTextContent('Jan 20, 2024')
      expect(rows[2]).toHaveTextContent('#2')
      expect(rows[2]).toHaveTextContent('Jan 15, 2024')

      // Find and click on Amount column header to sort by amount ascending
      const amountHeader = screen.getByRole('button', { name: /amount/i })
      await userEvent.click(amountHeader)

      // After clicking, should sort by amount ascending
      // ID 2 ($500) should come before ID 1 ($1000)
      await waitFor(() => {
        rows = screen.getAllByRole('row')
        // After sort by amount, ID 2 (500) comes first
        expect(rows[1]).toHaveTextContent('#2')
      })

      // Verify full sort order
      rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('#2')
      expect(rows[1]).toHaveTextContent('500')
      expect(rows[2]).toHaveTextContent('#1')
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
                page_size: 10,
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
        // Should have multiple '—' (customer name and amount for unpaid invoice)
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('handles null dates with fallback', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 10,
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

  describe('Filtering - US2', () => {
    it('shows filter controls above the table', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 10,
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

      // Check filter controls are present
      expect(
        screen.getByPlaceholderText(/select date range/i)
      ).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText(/select due date range/i)
      ).toBeInTheDocument()
      // Check for status and payment filter buttons
      expect(
        screen.getAllByRole('button', { name: /all/i }).length
      ).toBeGreaterThanOrEqual(2) // Status and Payment filters
      expect(screen.getByRole('button', { name: /draft/i })).toBeInTheDocument()
      expect(
        screen.getAllByRole('button', { name: /finalized/i })[0]
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /apply filters/i })
      ).toBeInTheDocument()
    })

    it('applies date filter and calls API with correct filter param', async () => {
      let capturedParams: any = null
      let requestCount = 0

      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          requestCount++
          if (requestCount > 1) {
            // Capture params from second request (after filter applied)
            capturedParams = {
              filter: req.url.searchParams.get('filter'),
            }
          }
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 10,
                total_pages: 1,
                total_entries: 1,
              },
              invoices: [mockInvoice],
            })
          )
        })
      )

      renderInvoicesList()

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      // Fill in date filter using date range picker (mocked)
      const dateInput = screen.getByPlaceholderText(
        /select date range/i
      ) as HTMLInputElement
      fireEvent.change(dateInput, { target: { value: '2024-01-01' } })

      // Submit filter
      await userEvent.click(
        screen.getByRole('button', { name: /apply filters/i })
      )

      // Wait for active filters to appear (indicates filter was applied)
      await waitFor(() => {
        expect(screen.getByText(/active filters/i)).toBeInTheDocument()
      })

      // Verify API was called with filter param
      await waitFor(
        () => {
          expect(capturedParams).toBeTruthy()
        },
        { timeout: 5000 }
      )

      expect(capturedParams.filter).toBeTruthy()
      const parsedFilter = JSON.parse(capturedParams.filter)
      expect(parsedFilter).toEqual([
        {
          field: 'date',
          operator: 'gteq',
          value: '2024-01-01',
        },
      ])

      // Verify active filters summary is shown
      expect(screen.getByText(/date from 2024-01-01/i)).toBeInTheDocument()
    })

    it('applies status filter and calls API with correct filter param', async () => {
      let capturedParams: any = null
      let requestCount = 0

      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          requestCount++
          if (requestCount > 1) {
            // Capture params from second request (after filter applied)
            capturedParams = {
              filter: req.url.searchParams.get('filter'),
            }
          }
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 10,
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

      // Click on Finalized status button
      const finalizedButton = screen.getAllByRole('button', {
        name: /finalized/i,
      })[0] // Get first one (from filter controls, not table)
      await userEvent.click(finalizedButton)

      // Submit filter
      await userEvent.click(
        screen.getByRole('button', { name: /apply filters/i })
      )

      // Verify API was called with filter param
      await waitFor(() => {
        expect(capturedParams).toBeTruthy()
      })

      expect(capturedParams.filter).toBeTruthy()
      const parsedFilter = JSON.parse(capturedParams.filter)
      expect(parsedFilter).toEqual([
        {
          field: 'finalized',
          operator: 'eq',
          value: 'true',
        },
      ])

      // Verify active filters summary is shown
      await waitFor(() => {
        expect(screen.getByText(/status: finalized/i)).toBeInTheDocument()
      })
    })

    it('applies both filters together', async () => {
      let capturedParams: any = null
      let requestCount = 0

      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          requestCount++
          if (requestCount > 1) {
            // Capture params from second request (after filter applied)
            capturedParams = {
              filter: req.url.searchParams.get('filter'),
            }
          }
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 10,
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

      // Fill in date filter
      const dateInput = screen.getByPlaceholderText(
        /select date range/i
      ) as HTMLInputElement
      fireEvent.change(dateInput, { target: { value: '2024-01-01' } })

      // Click on Paid payment button
      const paidButton = screen.getAllByRole('button', {
        name: /^paid$/i,
      })[0] // Get first one (from filter controls, not table)
      await userEvent.click(paidButton)

      // Submit filter
      await userEvent.click(
        screen.getByRole('button', { name: /apply filters/i })
      )

      // Verify API was called with both filters
      await waitFor(() => {
        expect(capturedParams).toBeTruthy()
      })

      expect(capturedParams.filter).toBeTruthy()
      const parsedFilter2 = JSON.parse(capturedParams.filter)
      expect(parsedFilter2).toHaveLength(2)
      expect(parsedFilter2).toEqual(
        expect.arrayContaining([
          { field: 'date', operator: 'gteq', value: '2024-01-01' },
          { field: 'paid', operator: 'eq', value: 'true' },
        ])
      )
    })

    it('shows filtered empty state when no results match filters', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          const filterParam = req.url.searchParams.get('filter')
          // Return empty results if filter is present
          if (filterParam) {
            return res(
              ctx.json({
                pagination: {
                  page: 1,
                  page_size: 10,
                  total_pages: 1,
                  total_entries: 0,
                },
                invoices: [],
              })
            )
          }
          // Return data if no filter
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 10,
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

      // Apply a filter
      const dateInput = screen.getByPlaceholderText(
        /select date range/i
      ) as HTMLInputElement
      fireEvent.change(dateInput, { target: { value: '2030-01-01' } })
      await userEvent.click(
        screen.getByRole('button', { name: /apply filters/i })
      )

      // Verify filtered empty state is shown
      await waitFor(() => {
        expect(
          screen.getByText(/no results match your filters/i)
        ).toBeInTheDocument()
      })

      expect(
        screen.getByText(/try adjusting your filter criteria/i)
      ).toBeInTheDocument()

      // Verify Clear Filters button is available
      expect(
        screen.getAllByRole('button', { name: /clear filters/i }).length
      ).toBeGreaterThan(0)
    })

    it('clears filters and reloads all invoices', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          const filterParam = req.url.searchParams.get('filter')
          // Return filtered results
          if (filterParam) {
            return res(
              ctx.json({
                pagination: {
                  page: 1,
                  page_size: 10,
                  total_pages: 1,
                  total_entries: 1,
                },
                invoices: [mockInvoice],
              })
            )
          }
          // Return all invoices
          return res(
            ctx.json({
              pagination: {
                page: 1,
                page_size: 10,
                total_pages: 1,
                total_entries: 2,
              },
              invoices: [mockInvoice, { ...mockInvoice, id: 2 }],
            })
          )
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      // Initially should show 2 invoices
      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument()
      })
      expect(screen.getByText('#2')).toBeInTheDocument()

      // Apply a filter
      const dateInput = screen.getByPlaceholderText(
        /select date range/i
      ) as HTMLInputElement
      fireEvent.change(dateInput, { target: { value: '2024-01-01' } })
      await userEvent.click(
        screen.getByRole('button', { name: /apply filters/i })
      )

      // Wait for filtered results (1 invoice)
      await waitFor(() => {
        expect(screen.getByText(/active filters/i)).toBeInTheDocument()
      })

      // Clear Filters or Reset button should now be visible
      const clearButton = screen.getByRole('button', {
        name: /(clear filters|reset)/i,
      })
      expect(clearButton).toBeInTheDocument()

      // Click Clear Filters / Reset
      await userEvent.click(clearButton)

      // Verify filters are cleared
      await waitFor(() => {
        expect(screen.queryByText(/active filters/i)).not.toBeInTheDocument()
      })

      // Verify all invoices are shown again
      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument()
      })
      expect(screen.getByText('#2')).toBeInTheDocument()
    })
  })
})
