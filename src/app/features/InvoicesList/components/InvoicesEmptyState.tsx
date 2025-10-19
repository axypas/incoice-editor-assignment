/**
 * InvoicesEmptyState component
 * Displays appropriate empty state based on whether filters are active
 */
import React from 'react'
import { Button } from 'react-bootstrap'

interface InvoicesEmptyStateProps {
  onCreateInvoice: () => void
}

const InvoicesEmptyState = ({
  onCreateInvoice,
}: InvoicesEmptyStateProps): JSX.Element => {
  // No invoices at all - show "create invoice" message
  return (
    <div className="text-center mt-5 py-5">
      <h4 className="text-muted">No invoices yet</h4>
      <p className="text-muted">Create your first invoice to get started</p>
      <Button variant="primary" className="mt-3" onClick={onCreateInvoice}>
        Create Invoice
      </Button>
    </div>
  )
}

export default InvoicesEmptyState
