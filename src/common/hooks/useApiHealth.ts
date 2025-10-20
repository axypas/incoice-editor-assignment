/**
 * Hook to verify API connection and authentication
 * Implements US0 - App can talk to the API (bootstrap)
 */

import { useState, useEffect } from 'react'
import { useApi } from 'api'
import { logger } from 'common/utils/logger'
import { parseApiError } from 'common/utils/apiErrorParser'

interface ApiHealthState {
  isChecking: boolean
  isHealthy: boolean
  isAuthError: boolean
  error: string | null
}

/**
 * Checks if the API is reachable and properly authenticated
 * Makes a lightweight API call on mount to verify connectivity
 */
export const useApiHealth = (): ApiHealthState => {
  const api = useApi()
  const [state, setState] = useState<ApiHealthState>({
    isChecking: true,
    isHealthy: false,
    isAuthError: false,
    error: null,
  })

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        // Make a lightweight API call to verify connection
        // Using getInvoices with per_page=1 to minimize data transfer
        await api.getInvoices({ per_page: 1 })

        setState({
          isChecking: false,
          isHealthy: true,
          isAuthError: false,
          error: null,
        })
      } catch (err: unknown) {
        logger.error('API health check failed:', err)

        // Parse API error for clean status code access
        const apiError = parseApiError(err, 'Unable to connect to the API')
        const isAuthError =
          apiError.statusCode === 401 || apiError.statusCode === 403

        setState({
          isChecking: false,
          isHealthy: false,
          isAuthError,
          error: isAuthError
            ? 'Authentication failed. Please check your API token.'
            : apiError.message,
        })
      }
    }

    checkApiHealth()
  }, [api])

  return state
}
