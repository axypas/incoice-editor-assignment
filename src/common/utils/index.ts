/**
 * Barrel export for common utilities
 * Provides a single entry point for importing utility functions
 */

// Re-export all from calculations
export * from './calculations'

// Re-export all from validation
export * from './validation'

// Re-export all from logger
export * from './logger'

// For currency, we only export the unique exports to avoid conflicts
// (formatCurrency from currency.ts wraps the one from calculations.ts)
export {
  CURRENCIES,
  type CurrencyCode,
  getCurrencyConfig,
  formatCurrency,
  formatPercentage,
  getCurrencySymbol,
  formatDate,
  formatDateRange,
  getPaymentStatusLabel,
  formatQuantity,
  abbreviateNumber,
} from './currency'
