/**
 * FinalizedInvoiceAlert component
 * Displays alert when trying to edit a finalized invoice
 */

import { Alert, Button } from 'react-bootstrap'

interface FinalizedInvoiceAlertProps {
  onBackToList: () => void
  onViewInvoice: () => void
}

const FinalizedInvoiceAlert = ({
  onBackToList,
  onViewInvoice,
}: FinalizedInvoiceAlertProps): JSX.Element => {
  return (
    <div className="pb-4">
      <Alert variant="info" className="mt-4">
        <Alert.Heading>Invoice Finalized</Alert.Heading>
        <p>This invoice is finalized and cannot be edited.</p>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={onBackToList}>
            Back to List
          </Button>
          <Button variant="outline-secondary" onClick={onViewInvoice}>
            View Invoice
          </Button>
        </div>
      </Alert>
    </div>
  )
}

export default FinalizedInvoiceAlert
