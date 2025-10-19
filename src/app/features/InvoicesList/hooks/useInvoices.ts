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

        // Map API types to domain types
        const mappedInvoices: Invoice[] = data.map((inv) => ({
          id: inv.id?.toString(),
          invoice_number: inv.id?.toString() || '',
          customer_id: inv.customer_id?.toString(),
          customer: inv.customer
            ? {
                id: inv.customer.id?.toString() || '',
                label: `${inv.customer.first_name} ${inv.customer.last_name}`,
                first_name: inv.customer.first_name,
                last_name: inv.customer.last_name,
                address: inv.customer.address || '',
                zip_code: inv.customer.zip_code || '',
                city: inv.customer.city || '',
                country: inv.customer.country || '',
                country_code: inv.customer.country_code || '',
              }
            : undefined,
          date: inv.date || '',
          deadline: inv.deadline || undefined,
          finalized: inv.finalized || false,
          paid: inv.paid || false,
          invoice_lines: (inv.invoice_lines || []).map((line) => ({
            id: line.id?.toString(),
            product_id: line.product_id?.toString(),
            product: line.product || null,
            label: line.label || '',
            quantity: parseFloat(line.quantity?.toString() || '0'),
            unit: line.unit || 'piece',
            unit_price: parseFloat(line.price || '0'),
            vat_rate: parseFloat(line.vat_rate || '0'),
          })),
          total: parseFloat(inv.total || '0'),
          tax: parseFloat(inv.tax || '0'),
        }))

        setInvoices(mappedInvoices)
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
    invoiceId: string,
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
      invoiceId: string,
      payload: UpdateInvoicePayload
    ): Promise<Invoice> => {
      try {
        setStatus('loading')
        setError(null)

        const response = await api.putInvoice(
          { id: parseInt(invoiceId, 10) },
          { invoice: payload }
        )

        const inv = response.data

        // Map API type to domain type
        const mappedInvoice = {
          ...inv,
          id: inv.id?.toString(),
          customer_id: inv.customer_id?.toString(),
          invoice_number: inv.id?.toString(),
          total: parseFloat((inv as any).total || '0'),
          tax: parseFloat((inv as any).tax || '0'),
          invoice_lines: ((inv as any).invoice_lines || []).map(
            (line: any) => ({
              ...line,
              id: line.id?.toString(),
              unit_price: parseFloat(line.price || '0'),
              vat_rate: parseFloat(line.vat_rate || '0'),
            })
          ),
        } as Invoice

        setStatus('success')
        return mappedInvoice
      } catch (err: any) {
        logger.error(`Failed to update invoice ${invoiceId}:`, err)

        const apiError: ApiError = {
          error: err.name || 'UpdateError',
          message: err.message || 'Failed to update invoice. Please try again.',
          statusCode: err.response?.status || 500,
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
