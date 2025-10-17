/**
 * Main App Component
 * Implements US0 - API health check with global error banner
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useApiHealth } from '../hooks/useApiHealth'

import InvoicesList from './components/InvoicesList'
import InvoiceShow from './components/InvoiceShow'

function App() {
  const { isChecking, isHealthy, isAuthError, error } = useApiHealth()

  return (
    <div className="px-5">
      {/* API Health Check - US0 */}
      {isChecking && (
        <div
          className="alert alert-info d-flex align-items-center mt-3"
          role="status"
        >
          <div
            className="spinner-border spinner-border-sm me-2"
            aria-hidden="true"
          ></div>
          <span>Loading your invoices...</span>
        </div>
      )}

      {!isChecking && !isHealthy && process.env.NODE_ENV !== 'production' && (
        <div
          className="alert alert-danger alert-dismissible fade show mt-3"
          role="alert"
        >
          <h5 className="alert-heading">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {isAuthError ? 'Authentication Error' : 'Connection Error'}
          </h5>
          <p className="mb-2">{error}</p>
          {isAuthError && (
            <div className="small">
              <strong>How to fix:</strong>
              <ol className="mb-0 mt-2">
                <li>
                  Copy <code>.env.template</code> to <code>.env.local</code>
                </li>
                <li>
                  Add your API token to <code>REACT_APP_API_TOKEN</code> in{' '}
                  <code>.env.local</code>
                </li>
                <li>Find the token in the repository description</li>
                <li>Restart the development server</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {isHealthy && (
        <Router>
          <Routes>
            <Route path="/invoice/:id" Component={InvoiceShow} />
            <Route path="/" Component={InvoicesList} />
          </Routes>
        </Router>
      )}
    </div>
  )
}

export default App
