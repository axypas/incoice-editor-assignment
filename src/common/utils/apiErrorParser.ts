/**
 * API error parsing utilities
 * Extracts meaningful error information from API responses
 */

import { ApiError } from 'common/types/invoice.types'
import { logger } from './logger'
import axios from 'axios'

/**
 * Type for API error response data
 */
interface ApiErrorData {
  error?: string
  message?: string
}

/**
 * Parses any error into a structured ApiError
 * Handles Axios errors, Error objects, and unknown errors
 */
export const parseApiError = (
  err: unknown,
  defaultMessage: string = 'An unexpected error occurred'
): ApiError => {
  // Handle Axios errors with response data
  if (axios.isAxiosError(err)) {
    const statusCode = err.response?.status || 500
    const apiErrorData = err.response?.data as ApiErrorData | undefined

    return {
      error: apiErrorData?.error || 'ApiError',
      message: apiErrorData?.message || defaultMessage,
      statusCode,
    }
  }

  // Handle standard Error objects
  if (err instanceof Error) {
    return {
      error: err.name,
      message: err.message,
      statusCode: 500,
    }
  }

  // Handle unknown errors
  logger.warn('Unknown error type encountered:', err)
  return {
    error: 'UnknownError',
    message: defaultMessage,
    statusCode: 500,
  }
}

/**
 * Gets a user-friendly error message based on status code
 */
export const getUserFriendlyErrorMessage = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please check your input.'
    case 401:
      return 'Authentication failed. Please check your API token.'
    case 403:
      return "You don't have permission to perform this action."
    case 404:
      return 'Resource not found.'
    case 409:
      return 'Conflict detected. The resource may have been modified.'
    case 422:
      return 'Validation failed. Please check your input.'
    case 429:
      return 'Too many requests. Please try again later.'
    case 500:
      return 'Server error. Please try again later.'
    case 503:
      return 'Service temporarily unavailable. Please try again later.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}
