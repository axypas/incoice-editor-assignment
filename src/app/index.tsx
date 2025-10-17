import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ApiProvider } from '../api'

import 'bootstrap/dist/css/bootstrap.min.css'

const apiBase = process.env.REACT_APP_API_BASE ?? ''
const apiToken = process.env.REACT_APP_API_TOKEN ?? ''
const domRoot = document.getElementById('root')
const root = createRoot(domRoot!)

root.render(
  <React.StrictMode>
    <ApiProvider url={apiBase} token={apiToken}>
      <App />
    </ApiProvider>
  </React.StrictMode>
)
