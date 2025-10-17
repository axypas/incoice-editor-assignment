/**
 * MSW request handlers
 * Define mock API responses for tests
 */

import { http, HttpResponse } from 'msw'

const API_BASE = 'https://jean-test-api.herokuapp.com'

export const handlers = [
  // Default handler: GET /invoices - returns empty list (success)
  http.get(`${API_BASE}/invoices`, () => {
    return HttpResponse.json({
      pagination: {
        page: 1,
        page_size: 25,
        total_pages: 1,
        total_entries: 0,
      },
      invoices: [],
    })
  }),

  // Default handler: GET /invoices/:id
  http.get(`${API_BASE}/invoices/:id`, ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      customer_id: 1,
      finalized: false,
      paid: false,
      date: '2024-01-01',
      deadline: '2024-01-31',
      total: '0.00',
      tax: '0.00',
      invoice_lines: [],
    })
  }),

  // Default handler: GET /search/customers - returns empty list
  http.get(`${API_BASE}/search/customers`, () => {
    return HttpResponse.json({
      pagination: {
        page: 1,
        page_size: 10,
        total_pages: 1,
        total_entries: 0,
      },
      customers: [],
    })
  }),

  // Default handler: GET /search/products - returns empty list
  http.get(`${API_BASE}/search/products`, () => {
    return HttpResponse.json({
      pagination: {
        page: 1,
        page_size: 10,
        total_pages: 1,
        total_entries: 0,
      },
      products: [],
    })
  }),
]
