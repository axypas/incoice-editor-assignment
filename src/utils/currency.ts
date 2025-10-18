/**
 * Currency formatting utilities
 * Ensures consistent financial display across the application
 */

import { formatCurrency as formatAmount, formatNumber } from './calculations'

// Supported currencies with their symbols and locale defaults
export const CURRENCIES = {
  EUR: { symbol: '€', locale: 'fr-FR', name: 'Euro' },
  USD: { symbol: '$', locale: 'en-US', name: 'US Dollar' },
  GBP: { symbol: '£', locale: 'en-GB', name: 'British Pound' },
  CHF: { symbol: 'CHF', locale: 'de-CH', name: 'Swiss Franc' },
} as const

export type CurrencyCode = keyof typeof CURRENCIES

/**
 * Gets the currency configuration
 */
export const getCurrencyConfig = (code: CurrencyCode = 'EUR') => {
  return CURRENCIES[code] || CURRENCIES.EUR
}

/**
 * Formats an amount with the appropriate currency symbol and locale
 */
export const formatCurrency = (
  amount: number,
  currencyCode: CurrencyCode = 'EUR'
): string => {
  const config = getCurrencyConfig(currencyCode)
  return formatAmount(amount, currencyCode, config.locale)
}

/**
 * Formats a percentage with proper locale
 */
export const formatPercentage = (
  value: number,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

/**
 * Gets the currency symbol for display
 */
export const getCurrencySymbol = (code: CurrencyCode = 'EUR'): string => {
  return getCurrencyConfig(code).symbol
}

/**
 * Formats a date according to locale
 */
export const formatDate = (
  date: string | Date,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  // Default options for invoice display
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }

  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj)
}

/**
 * Formats a date range (e.g., "Jan 1 - Jan 31, 2024")
 */
export const formatDateRange = (
  startDate: string | Date,
  endDate: string | Date,
  locale: string = 'en-US'
): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  // Check if same year
  const sameYear = start.getFullYear() === end.getFullYear()

  if (sameYear) {
    const startStr = formatDate(start, locale, {
      month: 'short',
      day: 'numeric',
    })
    const endStr = formatDate(end, locale)
    return `${startStr} - ${endStr}`
  } else {
    return `${formatDate(start, locale)} - ${formatDate(end, locale)}`
  }
}

/**
 * Gets display-friendly payment status
 */
export const getPaymentStatusLabel = (
  paid: boolean,
  deadline?: string
): { label: string; color: string } => {
  if (paid) {
    return { label: 'Paid', color: 'success' }
  }

  if (deadline) {
    const now = new Date()
    const due = new Date(deadline)

    if (now > due) {
      const daysOverdue = Math.ceil(
        (now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
      )
      return {
        label: `${daysOverdue} days overdue`,
        color: 'danger',
      }
    }

    const daysUntilDue = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntilDue <= 7) {
      return {
        label: `Due in ${daysUntilDue} days`,
        color: 'warning',
      }
    }
  }

  return { label: 'Unpaid', color: 'secondary' }
}

/**
 * Formats quantity with appropriate decimal places
 * Whole numbers show no decimals, decimals show up to 2 places
 */
export const formatQuantity = (
  quantity: number,
  unit: string = 'item'
): string => {
  const isWholeNumber = quantity % 1 === 0
  const formatted = formatNumber(quantity, isWholeNumber ? 0 : 2)

  // Add unit if it's singular/plural aware
  if (quantity === 1) {
    return `${formatted} ${unit}`
  } else if (unit.endsWith('y')) {
    // Simple pluralization for words ending in 'y'
    return `${formatted} ${unit.slice(0, -1)}ies`
  } else if (!unit.endsWith('s')) {
    return `${formatted} ${unit}s`
  }

  return `${formatted} ${unit}`
}

/**
 * Abbreviates large numbers for display (e.g., 1.5K, 2.3M)
 */
export const abbreviateNumber = (value: number): string => {
  if (value < 1000) return formatNumber(value, 0)
  if (value < 1_000_000) return `${formatNumber(value / 1000, 1)}K`
  if (value < 1_000_000_000) return `${formatNumber(value / 1_000_000, 1)}M`
  return `${formatNumber(value / 1_000_000_000, 1)}B`
}
