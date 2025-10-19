/**
 * Hook for finalizing invoices
 * Handles the finalize operation with proper error states
 */

import { useState, useCallback } from 'react'
import { useApi } from 'api'
import { AsyncStatus, ApiError } from 'common/types/invoice.types'
import { logger } from 'common/utils/logger'

interface UseInvoiceFinalizeResult {
  finalizeInvoice: (invoiceId: string) => Promise<void>
  status: AsyncStatus
  error: ApiError | null
  isFinalizing: boolean
}

export const useInvoiceFinalize = (): UseInvoiceFinalizeResult => {
  const api = useApi()
  const [status, setStatus] = useState<AsyncStatus>('idle')
  const [error, setError] = useState<ApiError | null>(null)

  const finalizeInvoice = useCallback(
    async (invoiceId: string): Promise<void> => {
      try {
        setStatus('loading')
        setError(null)

        // Finalize the invoice by setting finalized to true
        await api.putInvoice(
          { id: parseInt(invoiceId, 10) },
          {
            invoice: {
              id: parseInt(invoiceId, 10),
              finalized: true,
            },
          }
        )

        setStatus('success')
      } catch (err) {
        logger.error(`Failed to finalize invoice ${invoiceId}:`, err)

        const apiError: ApiError = {
          error: err instanceof Error ? err.name : 'FinalizeError',
          message:
            err instanceof Error
              ? err.message
              : 'Failed to finalize invoice. Please try again.',
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
    finalizeInvoice,
    status,
    error,
    isFinalizing: status === 'loading',
  }
}
