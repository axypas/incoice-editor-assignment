/**
 * Hook for finalizing invoices
 * Handles the finalize operation with proper error states
 */

import { useState, useCallback } from 'react'
import { useApi } from 'api'
import { AsyncStatus, ApiError } from 'common/types/invoice.types'
import { logger } from 'common/utils/logger'
import { parseApiError } from 'common/utils/apiErrorParser'

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

        // Use parseApiError for clean, consistent error parsing
        const apiError = parseApiError(err, 'Failed to finalize invoice')

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
