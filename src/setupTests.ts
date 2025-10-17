// Polyfill TextEncoder/TextDecoder for MSW in jsdom environment
// This must be done BEFORE importing MSW

import { server } from './test/server'
import type { SetupServer } from 'msw/node'
import '@testing-library/jest-dom'

// Make server available globally for tests
declare global {
  // eslint-disable-next-line no-var
  var mswServer: SetupServer | undefined
}

globalThis.mswServer = server

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// Reset handlers after each test to ensure test isolation
afterEach(() => {
  server.resetHandlers()
})

// Clean up after all tests
afterAll(() => {
  server.close()
})
