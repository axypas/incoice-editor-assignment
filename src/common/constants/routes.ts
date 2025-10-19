/**
 * Application route constants
 * Centralized route definitions for consistent navigation
 */

export const ROUTES = {
  HOME: '/',
  INVOICES_NEW: '/invoices/new',
  INVOICES_EDIT: '/invoices/:id/edit',
  INVOICE_SHOW: '/invoice/:id',
} as const

export const buildInvoiceEditRoute = (id: string) => `/invoices/${id}/edit`
export const buildInvoiceShowRoute = (id: string) => `/invoice/${id}`
