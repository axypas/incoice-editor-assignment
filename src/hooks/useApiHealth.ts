/**
 * Hook to verify API connection and authentication
 * Implements US0 - App can talk to the API (bootstrap)
 */

import { useState, useEffect } from 'react'
import { useApi } from '../api'
import { logger } from '../utils/logger'

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
        // Using getInvoices with limit to minimize data transfer
        await api.getInvoices(null, { per_page: 1 })

        setState({
          isChecking: false,
          isHealthy: true,
          isAuthError: false,
          error: null,
        })
      } catch (err: any) {
        logger.error('API health check failed:', err)

        const statusCode = err.response?.status
        const isAuthError = statusCode === 401 || statusCode === 403

        setState({
          isChecking: false,
          isHealthy: false,
          isAuthError,
          error: isAuthError
            ? 'Authentication failed. Please check your API token.'
            : 'Unable to connect to the API. Please check your network connection.',
        })
      }
    }

    checkApiHealth()
  }, [api])

  return state
}
