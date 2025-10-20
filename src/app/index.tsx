import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ApiProvider } from '../api'

import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'

// Validate required environment variables
const apiBase = process.env.REACT_APP_API_BASE
const apiToken = process.env.REACT_APP_API_TOKEN

if (!apiBase || !apiToken) {
  const missingVars: string[] = []
  if (!apiBase) missingVars.push('REACT_APP_API_BASE')
  if (!apiToken) missingVars.push('REACT_APP_API_TOKEN')

  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}\n\n` +
      'Please create a .env.local file with the following:\n' +
      '  REACT_APP_API_BASE=https://jean-test-api.herokuapp.com\n' +
      '  REACT_APP_API_TOKEN=your-api-token-here\n\n' +
      'See .env.template for more details.'
  )
}

const domRoot = document.getElementById('root')
const root = createRoot(domRoot!)

root.render(
  <StrictMode>
    <ApiProvider url={apiBase} token={apiToken}>
      <App />
    </ApiProvider>
  </StrictMode>
)
