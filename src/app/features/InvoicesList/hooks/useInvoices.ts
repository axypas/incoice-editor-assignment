/**
 * Custom hook for fetching and managing invoices
 * Isolates side effects from components
 * Returns { data, status, error, refetch } for predictable state management
 */

import { useState, useEffect, useCallback } from 'react'
import { useApi } from 'api'
import {
  Invoice,
  InvoiceFilter,
  AsyncStatus,
  ApiError,
} from 'common/types/invoice.types'
import { Paths } from 'api/gen/client'
import { logger } from 'common/utils/logger'

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
  sort?: string
}

/**
 * Hook for fetching invoices with optional filters
 * @param options - Configuration options including filters
 * @returns Invoices data, status, and refetch function
 */
export const useInvoices = (
  options: UseInvoicesOptions = {}
): UseInvoicesResult => {
  const {
    filters = [],
    autoFetch = true,
    page = 1,
    perPage = 10,
    sort,
  } = options
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
        const params: Paths.GetInvoices.QueryParameters & { sort?: string } = {
          page: currentPage ?? page,
          per_page: currentPerPage ?? perPage,
        }
        if (filters.length > 0) {
          params.filter = JSON.stringify(filters)
        }
        if (sort) {
          params.sort = sort
        }

        // Call API with filters, sorting, and pagination
        const response = await api.getInvoices(params)

        // Extract invoices array and pagination from response
        const data = response.data?.invoices || []
        const paginationData = response.data?.pagination || null

        // Use BE types directly (no mapping needed)
        setInvoices(data)
        setPagination(paginationData)
        setStatus('success')
      } catch (err) {
        logger.error('Failed to fetch invoices:', err)

        const apiError: ApiError = {
          error: err instanceof Error ? err.name : 'FetchError',
          message: 'Unable to load invoices. Please try again.',
          statusCode:
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { status?: number } }).response?.status ||
                500
              : 500,
        }

        setError(apiError)
        setStatus('error')
      }
    },
    [api, filters, page, perPage, sort]
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
export const useInvoice = (invoiceId: number | string) => {
  const api = useApi()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [status, setStatus] = useState<AsyncStatus>('idle')
  const [error, setError] = useState<ApiError | null>(null)

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return

    try {
      setStatus('loading')
      setError(null)

      // Convert string to number if needed
      const numericId =
        typeof invoiceId === 'string' ? parseInt(invoiceId, 10) : invoiceId
      const response = await api.getInvoice({ id: numericId })

      // Use BE type directly (no mapping needed)
      const inv = response.data

      setInvoice(inv)
      setStatus('success')
    } catch (err) {
      logger.error(`Failed to fetch invoice ${invoiceId}:`, err)

      const apiError: ApiError = {
        error: err instanceof Error ? err.name : 'FetchError',
        message:
          err instanceof Error
            ? err.message
            : 'Failed to load invoice. Please try again.',
        statusCode:
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { status?: number } }).response?.status ||
              500
            : 500,
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

/**
 * Hook for updating an invoice
 * Returns { updateInvoice, status, error }
 */
interface UpdateInvoicePayload {
  id: number
  customer_id?: number
  date?: string | null
  deadline?: string | null
  paid?: boolean
  finalized?: boolean
  invoice_lines_attributes?: Array<{
    id?: number
    _destroy?: boolean
    product_id?: number
    quantity?: number
    label?: string
  }>
}

interface UseUpdateInvoiceResult {
  updateInvoice: (
    invoiceId: number | string,
    payload: UpdateInvoicePayload
  ) => Promise<Invoice>
  status: AsyncStatus
  error: ApiError | null
  isUpdating: boolean
}

export const useUpdateInvoice = (): UseUpdateInvoiceResult => {
  const api = useApi()

  const [status, setStatus] = useState<AsyncStatus>('idle')
  const [error, setError] = useState<ApiError | null>(null)

  const updateInvoice = useCallback(
    async (
      invoiceId: number | string,
      payload: UpdateInvoicePayload
    ): Promise<Invoice> => {
      try {
        setStatus('loading')
        setError(null)

        // Convert string to number if needed
        const numericId =
          typeof invoiceId === 'string' ? parseInt(invoiceId, 10) : invoiceId

        const response = await api.putInvoice(
          { id: numericId },
          { invoice: payload }
        )

        // Use BE type directly (no mapping needed)
        const invoice = response.data

        setStatus('success')
        return invoice
      } catch (err) {
        logger.error(`Failed to update invoice ${invoiceId}:`, err)

        const apiError: ApiError = {
          error: err instanceof Error ? err.name : 'UpdateError',
          message:
            err instanceof Error
              ? err.message
              : 'Failed to update invoice. Please try again.',
          statusCode:
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { status?: number } }).response?.status ||
                500
              : 500,
        }

        setError(apiError)
        setStatus('error')
        throw err
      }
    },
    [api]
  )

  return {
    updateInvoice,
    status,
    error,
    isUpdating: status === 'loading',
  }
}
