/**
 * Validation constants
 * Min/max values, regex patterns, and validation rules
 */

export const VALIDATION = {
  MIN_LINE_ITEMS: 1,
  MAX_LINE_ITEMS: 100,
  MIN_QUANTITY: 0,
  MIN_UNIT_PRICE: 0,
  DECIMAL_PLACES: 2,
} as const

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_DATE: 'Please enter a valid date (YYYY-MM-DD)',
  FUTURE_DATE: 'Date cannot be in the future',
  INVALID_AMOUNT: 'Please enter a valid amount',
  MIN_QUANTITY: 'Quantity must be greater than 0',
  DEADLINE_BEFORE_DATE: 'Payment deadline must be after invoice date',
} as const
