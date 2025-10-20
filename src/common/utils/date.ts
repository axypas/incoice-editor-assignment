/**
 * Date formatting utilities
 * Ensures consistent date display across the application
 */

import { isDate, isString } from 'lodash'
import { logger } from './logger'

/**
 * Validates if a value is a valid date
 * Uses lodash for type checking and native Date validation
 */
const isValidDate = (value: unknown): value is Date => {
  if (!isDate(value)) {
    return false
  }
  return !isNaN(value.getTime())
}

/**
 * Formats a date according to locale with validation
 * Returns 'N/A' for null/undefined, 'Invalid Date' for malformed dates
 */
export const formatDate = (
  date: string | Date | null | undefined,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string => {
  // Handle null/undefined
  if (!date) {
    return 'N/A'
  }

  // Convert string to Date if needed
  const dateObj = isString(date) ? new Date(date) : date

  // Validate date object using lodash-powered validation
  if (!isValidDate(dateObj)) {
    logger.error('Invalid date provided to formatDate:', date)
    return 'Invalid Date'
  }

  // Default options for invoice display
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj)
  } catch (error) {
    logger.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}
