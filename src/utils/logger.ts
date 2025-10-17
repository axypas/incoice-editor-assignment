/**
 * Logger utility
 * - Suppresses ALL logs in test and production environments
 * - Only logs in development for debugging
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  error: (message: string, error?: any) => {
    if (isDev) {
      console.error(message, error)
    }
  },

  warn: (message: string, data?: any) => {
    if (isDev) {
      console.warn(message, data)
    }
  },

  info: (message: string, data?: any) => {
    if (isDev) {
      console.log(message, data)
    }
  },
}
