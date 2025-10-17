/**
 * MSW request handlers
 * Define mock API responses for tests
 */

import { rest } from 'msw'
import { API_BASE } from './constants'

export const handlers = [
  // Default handler: GET /invoices - returns empty list (success)
  rest.get(`${API_BASE}/invoices`, (req, res, ctx) => {
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
  }),

  // Default handler: GET /invoices/:id
  rest.get(`${API_BASE}/invoices/:id`, (req, res, ctx) => {
    return res(
      ctx.json({
        id: Number(req.params.id),
        customer_id: 1,
        finalized: false,
        paid: false,
        date: '2024-01-01',
        deadline: '2024-01-31',
        total: '0.00',
        tax: '0.00',
        invoice_lines: [],
      })
    )
  }),

  // Default handler: GET /search/customers - returns empty list
  rest.get(`${API_BASE}/search/customers`, (req, res, ctx) => {
    return res(
      ctx.json({
        pagination: {
          page: 1,
          page_size: 10,
          total_pages: 1,
          total_entries: 0,
        },
        customers: [],
      })
    )
  }),

  // Default handler: GET /search/products - returns empty list
  rest.get(`${API_BASE}/search/products`, (req, res, ctx) => {
    return res(
      ctx.json({
        pagination: {
          page: 1,
          page_size: 10,
          total_pages: 1,
          total_entries: 0,
        },
        products: [],
      })
    )
  }),
]
