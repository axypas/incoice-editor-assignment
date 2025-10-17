/**
 * Custom hook for fetching and managing invoices
 * Isolates side effects from components
 * Returns { data, status, error, refetch } for predictable state management
 */

import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../api'
import {
  Invoice,
  InvoiceFilter,
  AsyncStatus,
  ApiError,
} from '../types/invoice.types'
import { Paths } from '../api/gen/client'
import { logger } from '../utils/logger'

interface Pagination {
  page: number
  page_size: number
  total_pages: number
  total_entries: number
}

interface UseInvoicesResult {
  invoices: Invoice[]
  pagination: Pagination | null
  status: AsyncStatus
  error: ApiError | null
  refetch: (page?: number, perPage?: number) => Promise<void>
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
}

interface UseInvoicesOptions {
  filters?: InvoiceFilter[]
  autoFetch?: boolean
  page?: number
  perPage?: number
}

/**
 * Hook for fetching invoices with optional filters
 * @param options - Configuration options including filters
 * @returns Invoices data, status, and refetch function
 */
export const useInvoices = (
  options: UseInvoicesOptions = {}
): UseInvoicesResult => {
  const { filters = [], autoFetch = true, page = 1, perPage = 10 } = options
  const api = useApi()

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [status, setStatus] = useState<AsyncStatus>('idle')
  const [error, setError] = useState<ApiError | null>(null)

  const fetchInvoices = useCallback(
    async (currentPage?: number, currentPerPage?: number) => {
      try {
        setStatus('loading')
        setError(null)

        // Build filter query param if filters provided
        const params: Paths.GetInvoices.QueryParameters = {
          page: currentPage ?? page,
          per_page: currentPerPage ?? perPage,
        }
        if (filters.length > 0) {
          params.filter = JSON.stringify(filters)
        }

        // Call API with filters and pagination
        const response = await api.getInvoices(params)

        // Extract invoices array and pagination from response
        const data = response.data?.invoices || []
        const paginationData = response.data?.pagination || null

        // Map API types to domain types
        const mappedInvoices = data.map((inv: any) => ({
          ...inv,
          id: inv.id?.toString(),
          customer_id: inv.customer_id?.toString(),
          invoice_number: inv.id?.toString(), // API doesn't provide invoice_number, use id as fallback
          total: parseFloat(inv.total || '0'),
          tax: parseFloat(inv.tax || '0'),
          invoice_lines: (inv.invoice_lines || []).map((line: any) => ({
            ...line,
            id: line.id?.toString(),
            unit_price: parseFloat(line.price || '0'),
            vat_rate: parseFloat(line.vat_rate || '0'),
          })),
        }))

        setInvoices(mappedInvoices as Invoice[])
        setPagination(paginationData)
        setStatus('success')
      } catch (err: any) {
        logger.error('Failed to fetch invoices:', err)

        const apiError: ApiError = {
          error: err.name || 'FetchError',
          message: 'Unable to load invoices. Please try again.',
          statusCode: err.response?.status || 500,
        }

        setError(apiError)
        setStatus('error')
      }
    },
    [api, filters, page, perPage]
  )

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      fetchInvoices()
    }
  }, [fetchInvoices, autoFetch])

  return {
    invoices,
    pagination,
    status,
    error,
    refetch: fetchInvoices,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
  }
}

/**
 * Hook for fetching a single invoice by ID
 */
export const useInvoice = (invoiceId: string) => {
  const api = useApi()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [status, setStatus] = useState<AsyncStatus>('idle')
  const [error, setError] = useState<ApiError | null>(null)

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return

    try {
      setStatus('loading')
      setError(null)

      const response = await api.getInvoice(invoiceId)
      const inv = response.data

      // Map API type to domain type
      const mappedInvoice = {
        ...inv,
        id: inv.id?.toString(),
        customer_id: inv.customer_id?.toString(),
        invoice_number: inv.id?.toString(), // API doesn't provide invoice_number, use id as fallback
        total: parseFloat((inv as any).total || '0'),
        tax: parseFloat((inv as any).tax || '0'),
        invoice_lines: ((inv as any).invoice_lines || []).map((line: any) => ({
          ...line,
          id: line.id?.toString(),
          unit_price: parseFloat(line.price || '0'),
          vat_rate: parseFloat(line.vat_rate || '0'),
        })),
      } as Invoice

      setInvoice(mappedInvoice)
      setStatus('success')
    } catch (err: any) {
      logger.error(`Failed to fetch invoice ${invoiceId}:`, err)

      const apiError: ApiError = {
        error: err.name || 'FetchError',
        message: err.message || 'Failed to load invoice. Please try again.',
        statusCode: err.response?.status || 500,
      }

      setError(apiError)
      setStatus('error')
    }
  }, [api, invoiceId])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  return {
    invoice,
    status,
    error,
    refetch: fetchInvoice,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
  }
}
