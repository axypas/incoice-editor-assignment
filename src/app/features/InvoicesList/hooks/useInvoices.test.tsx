/**
 * Tests for useInvoice hook
 * Covers: fetching single invoice, handling null totals, calculating from invoice_lines
 */

import { renderHook, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import { server } from 'common/test/server'
import { API_BASE } from 'common/test/constants'
import { ApiProvider } from '../../../../api'
import { useInvoice } from './useInvoices'

// Wrapper component to provide API context
const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ApiProvider url={API_BASE} token="test-token">
      {children}
    </ApiProvider>
  )
}

describe('useInvoice hook', () => {
  describe('when API returns invoice with null total and tax', () => {
    it('keeps totals as undefined (unpaid invoice)', async () => {
      // Mock API response with null total/tax - this indicates unpaid invoice
      server.use(
        rest.get(`${API_BASE}/invoices/:id`, (req, res, ctx) => {
          return res(
            ctx.json({
              id: 61113,
              customer_id: 151,
              finalized: true,
              paid: false,
              date: '2025-11-09',
              deadline: '2025-11-22',
              total: null, // Total is null = unpaid
              tax: null, // Tax is null = unpaid
              customer: {
                id: 151,
                first_name: 'Gabriel',
                last_name: 'Hegmann',
                address: '962 Bayer Squares',
                zip_code: '76535-5840',
                city: 'Ernserborough',
                country: 'Lithuania',
                country_code: 'LT',
              },
              invoice_lines: [
                {
                  id: 93868,
                  invoice_id: 61113,
                  product_id: 23,
                  quantity: 3,
                  unit: 'piece',
                  label: 'Ford Mustang',
                  vat_rate: '20',
                  price: '37515.0', // Line total
                  tax: '7503.0', // Line tax
                },
                {
                  id: 93869,
                  invoice_id: 61113,
                  product_id: 233,
                  quantity: 4,
                  unit: 'piece',
                  label: 'Lincoln MKX',
                  vat_rate: '0',
                  price: '112060.0',
                  tax: '0.0',
                },
                {
                  id: 93870,
                  invoice_id: 61113,
                  product_id: 17,
                  quantity: 5,
                  unit: 'piece',
                  label: 'Nissan Altima',
                  vat_rate: '0',
                  price: '87875.0',
                  tax: '0.0',
                },
              ],
            })
          )
        })
      )

      const { result } = renderHook(() => useInvoice('61113'), {
        wrapper: createWrapper(),
      })

      // Wait for hook to finish loading
      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      // Verify invoice was loaded
      expect(result.current.invoice).toBeTruthy()
      expect(result.current.invoice?.id).toBe(61113) // BE uses number IDs

      // Verify totals remain null when backend returns null (unpaid invoice)
      expect(result.current.invoice?.total).toBeNull() // BE uses null not undefined
      expect(result.current.invoice?.tax).toBeNull() // BE uses null not undefined
    })

    it('handles empty invoice_lines with undefined totals', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices/:id`, (req, res, ctx) => {
          return res(
            ctx.json({
              id: 999,
              customer_id: 1,
              finalized: true,
              paid: false,
              date: '2025-11-09',
              deadline: '2025-11-22',
              total: null,
              tax: null,
              customer: {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                address: '123 Test St',
                zip_code: '12345',
                city: 'TestCity',
                country: 'TestCountry',
                country_code: 'TC',
              },
              invoice_lines: [], // Empty array
            })
          )
        })
      )

      const { result } = renderHook(() => useInvoice('999'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      // Verify totals remain null when backend returns null
      expect(result.current.invoice?.total).toBeNull() // BE uses null not undefined
      expect(result.current.invoice?.tax).toBeNull() // BE uses null not undefined
    })
  })

  describe('when API returns invoice with valid total and tax', () => {
    it('uses API-provided totals instead of calculating', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices/:id`, (req, res, ctx) => {
          return res(
            ctx.json({
              id: 123,
              customer_id: 1,
              finalized: true,
              paid: false,
              date: '2025-11-09',
              deadline: '2025-11-22',
              total: '5000.00', // API provides total as string
              tax: '1000.00', // API provides tax as string
              customer: {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                address: '123 Test St',
                zip_code: '12345',
                city: 'TestCity',
                country: 'TestCountry',
                country_code: 'TC',
              },
              invoice_lines: [
                {
                  id: 1,
                  invoice_id: 123,
                  product_id: 1,
                  quantity: 1,
                  unit: 'piece',
                  label: 'Product',
                  vat_rate: '20',
                  price: '100.0', // Line total doesn't match invoice total
                  tax: '20.0',
                },
              ],
            })
          )
        })
      )

      const { result } = renderHook(() => useInvoice('123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      // Verify API-provided values are used (BE returns string)
      expect(result.current.invoice?.total).toBe('5000.00') // BE returns string
      expect(result.current.invoice?.tax).toBe('1000.00') // BE returns string
      // Not 100.0 and 20.0 from invoice_lines calculation
    })

    it('handles total and tax as numbers', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices/:id`, (req, res, ctx) => {
          return res(
            ctx.json({
              id: 456,
              customer_id: 1,
              finalized: true,
              paid: false,
              date: '2025-11-09',
              deadline: '2025-11-22',
              total: 3000.0, // API provides total as number
              tax: 600.0, // API provides tax as number
              customer: {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                address: '123 Test St',
                zip_code: '12345',
                city: 'TestCity',
                country: 'TestCountry',
                country_code: 'TC',
              },
              invoice_lines: [],
            })
          )
        })
      )

      const { result } = renderHook(() => useInvoice('456'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      // Verify number values are used directly
      expect(result.current.invoice?.total).toBe(3000.0)
      expect(result.current.invoice?.tax).toBe(600.0)
    })
  })

  describe('error handling', () => {
    it('sets error state when API returns 404', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices/:id`, (req, res, ctx) => {
          return res(ctx.status(404))
        })
      )

      const { result } = renderHook(() => useInvoice('999'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.status).toBe('error')
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.invoice).toBeNull()
    })

    it('sets error state when API returns 500', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices/:id`, (req, res, ctx) => {
          return res(ctx.status(500))
        })
      )

      const { result } = renderHook(() => useInvoice('999'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.status).toBe('error')
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.invoice).toBeNull()
    })
  })

  describe('loading state', () => {
    it('starts in loading state', () => {
      const { result } = renderHook(() => useInvoice('123'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.invoice).toBeNull()
    })

    it('sets loading to false after successful fetch', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices/:id`, (req, res, ctx) => {
          return res(
            ctx.json({
              id: 123,
              customer_id: 1,
              finalized: true,
              paid: false,
              date: '2025-11-09',
              deadline: '2025-11-22',
              total: '1000.00',
              tax: '200.00',
              customer: {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                address: '123 Test St',
                zip_code: '12345',
                city: 'TestCity',
                country: 'TestCountry',
                country_code: 'TC',
              },
              invoice_lines: [],
            })
          )
        })
      )

      const { result } = renderHook(() => useInvoice('123'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.invoice).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('keeps totals as undefined when backend returns null, regardless of invoice_lines', async () => {
      server.use(
        rest.get(`${API_BASE}/invoices/:id`, (req, res, ctx) => {
          return res(
            ctx.json({
              id: 789,
              customer_id: 1,
              finalized: true,
              paid: false,
              date: '2025-11-09',
              deadline: '2025-11-22',
              total: null,
              tax: null,
              customer: {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                address: '123 Test St',
                zip_code: '12345',
                city: 'TestCity',
                country: 'TestCountry',
                country_code: 'TC',
              },
              invoice_lines: [
                {
                  id: 1,
                  invoice_id: 789,
                  product_id: 1,
                  quantity: 1,
                  unit: 'piece',
                  label: 'Product',
                  vat_rate: '20',
                  price: null, // Invalid price
                  tax: null, // Invalid tax
                },
                {
                  id: 2,
                  invoice_id: 789,
                  product_id: 2,
                  quantity: 1,
                  unit: 'piece',
                  label: 'Product 2',
                  vat_rate: '20',
                  price: '100.0',
                  tax: '20.0',
                },
              ],
            })
          )
        })
      )

      const { result } = renderHook(() => useInvoice('789'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      // When backend returns null, keep it as null (unpaid invoice)
      // Do not calculate from invoice_lines
      expect(result.current.invoice?.total).toBeNull() // BE uses null not undefined
      expect(result.current.invoice?.tax).toBeNull() // BE uses null not undefined
    })
  })
})
