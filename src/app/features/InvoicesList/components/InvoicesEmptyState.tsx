/**
 * InvoicesEmptyState component
 * Displays appropriate empty state based on whether filters are active
 */
import { Button } from 'react-bootstrap'

interface InvoicesEmptyStateProps {
  onCreateInvoice: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

const InvoicesEmptyState = ({
  onCreateInvoice,
  hasActiveFilters,
  onClearFilters,
}: InvoicesEmptyStateProps): JSX.Element => {
  if (hasActiveFilters) {
    // Filters are active but no results - show "no results" message
    return (
      <div className="text-center mt-5 py-5">
        <h4 className="text-muted">No invoices found</h4>
        <p className="text-muted">
          No invoices match your current filters. Try adjusting your search
          criteria.
        </p>
        <Button
          variant="outline-primary"
          className="mt-3"
          onClick={onClearFilters}
        >
          Clear Filters
        </Button>
      </div>
    )
  }

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
