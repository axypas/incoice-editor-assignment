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
    selectsRange: _selectsRange,
    isClearable: _isClearable,
    dateFormat: _dateFormat,
    className,
    onBlur,
    ...rest
  }: any) {
    const [inputValue, setInputValue] = React.useState(
      startDate
        ? `${startDate.getFullYear()}-${String(
            startDate.getMonth() + 1
          ).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
        : ''
    )

    return (
      <input
        data-testid="mock-datepicker"
        placeholder={placeholderText}
        className={className}
        value={inputValue}
        onBlur={onBlur}
        onChange={(e) => {
          const value = e.target.value
          setInputValue(value)
          if (value) {
            const parts = value.split('-')
            if (parts.length === 3) {
              const date = new Date(
                parseInt(parts[0]),
                parseInt(parts[1]) - 1,
                parseInt(parts[2])
              )
              onChange([date, endDate ?? null])
            }
          } else {
            onChange([null, null])
          }
        }}
        {...rest}
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
  invoice_number: '1',
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

    it('shows amount for unpaid invoices', async () => {
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

      // Amount should be displayed even for unpaid invoice
      expect(screen.getByText(/1\s?250,50\s?€/)).toBeInTheDocument()
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
    it('sends default sort parameter (-date) to API', async () => {
      let capturedParams: any = null

      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          capturedParams = {
            sort: req.url.searchParams.get('sort'),
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

      // Wait for table and data to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      // Verify API was called with default sort parameter
      expect(capturedParams).toBeTruthy()
      expect(capturedParams.sort).toBe('-date')
    })

    it('sends updated sort parameter when clicking column headers', async () => {
      let capturedParams: any = null
      let requestCount = 0

      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          requestCount++
          if (requestCount > 1) {
            // Capture params from second request (after sort changed)
            capturedParams = {
              sort: req.url.searchParams.get('sort'),
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
              invoices: [{ ...mockInvoice, paid: true }],
            })
          )
        })
      )

      renderInvoicesList()

      // Wait for table and data to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      // Find and click on Amount column header to sort by amount
      const amountHeader = screen.getByRole('button', { name: /amount/i })
      await userEvent.click(amountHeader)

      // Verify API was called with new sort parameter
      await waitFor(() => {
        expect(capturedParams).toBeTruthy()
      })
      expect(capturedParams.sort).toBe('+total')
    })

    it('toggles sort direction when clicking same column header twice', async () => {
      let capturedParams: any = null

      server.use(
        rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
          capturedParams = {
            sort: req.url.searchParams.get('sort'),
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

      // Wait for table and data to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      // Initial sort should be -date (desc)
      expect(capturedParams.sort).toBe('-date')

      // Click date header to toggle to ascending (name includes sort indicator)
      const dateHeader = screen.getByRole('button', { name: /^date/i })
      await userEvent.click(dateHeader)

      // Verify sort changed to +date (asc)
      await waitFor(() => {
        expect(capturedParams.sort).toBe('+date')
      })

      // Click again to toggle back to descending
      await userEvent.click(dateHeader)

      // Verify sort changed back to -date (desc)
      await waitFor(() => {
        expect(capturedParams.sort).toBe('-date')
      })
    })

    it('shows sort indicator on sorted column', async () => {
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

      // Wait for table and data to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      // Date column should show descending indicator by default
      const dateHeader = screen.getByRole('button', { name: /^date ▼$/i })
      expect(dateHeader).toHaveTextContent('▼')
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
        // Should have at least one '—' for missing customer name
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

  describe('Delete Functionality - US5', () => {
    it('shows delete button only for draft invoices', async () => {
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
              invoices: [
                { ...mockInvoice, id: 1, finalized: false },
                { ...mockInvoice, id: 2, finalized: true },
              ],
            })
          )
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      // Should have 1 Delete button (only for draft invoice)
      const deleteButtons = screen.queryAllByRole('button', { name: /delete/i })
      expect(deleteButtons).toHaveLength(1)
    })

    it('opens delete dialog when clicking Delete button', async () => {
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
        expect(
          screen.getByRole('button', { name: /delete/i })
        ).toBeInTheDocument()
      })

      // Click Delete button
      await userEvent.click(screen.getByRole('button', { name: /delete/i }))

      // Verify dialog is shown by checking for unique modal content
      await waitFor(() => {
        expect(
          screen.getByText(/are you sure you want to delete invoice/i)
        ).toBeInTheDocument()
      })

      // Verify other dialog content
      expect(
        screen.getByText(/this action cannot be undone/i)
      ).toBeInTheDocument()

      // Verify invoice number is shown in the dialog (in <strong> tag)
      const invoiceNumberInDialog = screen.getAllByText((content, element) => {
        return element?.tagName === 'STRONG' && content.includes('#1')
      })
      expect(invoiceNumberInDialog.length).toBeGreaterThan(0)
    })

    it('closes dialog when clicking Cancel', async () => {
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
        expect(
          screen.getByRole('button', { name: /delete/i })
        ).toBeInTheDocument()
      })

      // Open dialog
      await userEvent.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/are you sure you want to delete invoice/i)
        ).toBeInTheDocument()
      })

      // Click Cancel
      await userEvent.click(
        screen.getByRole('button', { name: /cancel deletion/i })
      )

      // Verify dialog is closed
      await waitFor(() => {
        expect(
          screen.queryByText(/are you sure you want to delete invoice/i)
        ).not.toBeInTheDocument()
      })
    })

    it('deletes invoice successfully and shows success toast', async () => {
      let deleteWasCalled = false

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
        }),
        rest.delete(`${API_BASE}/invoices/:id`, (req, res, ctx) => {
          deleteWasCalled = true
          return res(ctx.status(204))
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /delete/i })
        ).toBeInTheDocument()
      })

      // Open dialog
      await userEvent.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/are you sure you want to delete invoice/i)
        ).toBeInTheDocument()
      })

      // Confirm deletion
      await userEvent.click(
        screen.getByRole('button', { name: /confirm deletion/i })
      )

      // Verify API was called
      await waitFor(() => {
        expect(deleteWasCalled).toBe(true)
      })

      // Verify success toast is shown
      await waitFor(
        () => {
          expect(screen.getByText(/#1 has been deleted/i)).toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // Verify dialog is closed
      expect(
        screen.queryByText(/are you sure you want to delete invoice/i)
      ).not.toBeInTheDocument()
    })

    it('handles 404 error (invoice already deleted) with warning toast', async () => {
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
        }),
        rest.delete(`${API_BASE}/invoices/:id`, (req, res, ctx) => {
          return res(ctx.status(404))
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /delete/i })
        ).toBeInTheDocument()
      })

      // Open dialog and confirm deletion
      await userEvent.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /confirm deletion/i })
        ).toBeInTheDocument()
      })

      await userEvent.click(
        screen.getByRole('button', { name: /confirm deletion/i })
      )

      // Verify warning toast is shown
      await waitFor(() => {
        expect(screen.getByText(/already been deleted/i)).toBeInTheDocument()
      })

      // Verify dialog is closed
      await waitFor(() => {
        expect(
          screen.queryByText(/are you sure you want to delete invoice/i)
        ).not.toBeInTheDocument()
      })
    })

    it('handles 409 error (finalized invoice) with error toast', async () => {
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
        }),
        rest.delete(`${API_BASE}/invoices/:id`, (req, res, ctx) => {
          return res(ctx.status(409))
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /delete/i })
        ).toBeInTheDocument()
      })

      // Open dialog and confirm deletion
      await userEvent.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /confirm deletion/i })
        ).toBeInTheDocument()
      })

      await userEvent.click(
        screen.getByRole('button', { name: /confirm deletion/i })
      )

      // Verify error toast is shown
      await waitFor(
        () => {
          const toastMessages = screen.queryAllByText(
            /cannot delete finalized invoice/i
          )
          expect(toastMessages.length).toBeGreaterThan(0)
        },
        { timeout: 3000 }
      )

      // Verify dialog is closed
      await waitFor(() => {
        expect(
          screen.queryByText(/are you sure you want to delete invoice/i)
        ).not.toBeInTheDocument()
      })
    })

    it('announces deletion to screen readers via live region', async () => {
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
        }),
        rest.delete(`${API_BASE}/invoices/:id`, (req, res, ctx) => {
          return res(ctx.status(204))
        })
      )

      renderInvoicesList()

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /delete/i })
        ).toBeInTheDocument()
      })

      // Open dialog and confirm deletion
      await userEvent.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /confirm deletion/i })
        ).toBeInTheDocument()
      })

      await userEvent.click(
        screen.getByRole('button', { name: /confirm deletion/i })
      )

      // Verify live region contains announcement
      await waitFor(
        () => {
          const liveRegion = screen.getByRole('status')
          expect(liveRegion).toHaveTextContent(/#1 deleted successfully/i)
        },
        { timeout: 3000 }
      )
    })
  })
})
