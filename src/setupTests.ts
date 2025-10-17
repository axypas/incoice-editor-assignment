// Polyfills for MSW in Jest environment (MUST be first)
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream, TransformStream } from 'stream/web'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder
global.ReadableStream = ReadableStream as typeof global.ReadableStream
global.TransformStream = TransformStream as typeof global.TransformStream

// BroadcastChannel polyfill for MSW v2
global.BroadcastChannel = class BroadcastChannel {
  name: string
  constructor(name: string) {
    this.name = name
  }
  postMessage() {}
  addEventListener() {}
  removeEventListener() {}
  close() {}
  dispatchEvent() {
    return true
  }
  onmessage: ((this: BroadcastChannel, ev: MessageEvent) => any) | null = null
  onmessageerror: ((this: BroadcastChannel, ev: MessageEvent) => any) | null =
    null
} as typeof global.BroadcastChannel

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
// eslint-disable-next-line import/first
import '@testing-library/jest-dom'

// MSW setup for all tests - lazy load to ensure polyfills run first
let server: any

// Start MSW server before all tests
beforeAll(async () => {
  const msw = await import('./test/server')
  server = msw.server
  server.listen({ onUnhandledRequest: 'error' })
})

// Reset handlers after each test to ensure test isolation
afterEach(() => {
  if (server) server.resetHandlers()
})

// Clean up after all tests
afterAll(() => {
  if (server) server.close()
})
