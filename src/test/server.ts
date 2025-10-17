/**
 * MSW (Mock Service Worker) test server
 * Used to intercept network requests in tests
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Set up the MSW server with default handlers
export const server = setupServer(...handlers)
