/**
 * Currency formatting utilities
 * Ensures consistent financial display across the application
 */

import { formatCurrency as formatAmount } from './calculations'

// Supported currencies with their symbols and locale defaults
export const CURRENCIES = {
  EUR: { symbol: '€', locale: 'fr-FR', name: 'Euro' },
  USD: { symbol: '$', locale: 'en-US', name: 'US Dollar' },
  GBP: { symbol: '£', locale: 'en-GB', name: 'British Pound' },
  CHF: { symbol: 'CHF', locale: 'de-CH', name: 'Swiss Franc' },
} as const

export type CurrencyCode = keyof typeof CURRENCIES

/**
 * Gets the currency configuration (internal use only)
 */
const getCurrencyConfig = (code: CurrencyCode = 'EUR') => {
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
