/**
 * FinalizeInvoiceDialog component
 * Confirmation dialog for finalizing an invoice from the table
 */
import { Modal, Button } from 'react-bootstrap'
import { Invoice } from 'common/types/invoice.types'

interface FinalizeInvoiceDialogProps {
  invoice: Invoice | null
  show: boolean
  onConfirm: () => void
  onCancel: () => void
  isFinalizing: boolean
}

const FinalizeInvoiceDialog = ({
  invoice,
  show,
  onConfirm,
  onCancel,
  isFinalizing,
}: FinalizeInvoiceDialogProps): JSX.Element | null => {
  // Keyboard handler for Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isFinalizing) {
      e.preventDefault()
      onConfirm()
    }
  }

  if (!invoice) return null

  return (
    <Modal
      show={show}
      onHide={onCancel}
      centered
      aria-labelledby="finalize-invoice-dialog-title"
      aria-describedby="finalize-invoice-dialog-description"
      keyboard={!isFinalizing}
      onKeyDown={handleKeyDown}
    >
      <Modal.Header closeButton={!isFinalizing}>
        <Modal.Title id="finalize-invoice-dialog-title">
          Finalize Invoice #{invoice.id}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p id="finalize-invoice-dialog-description">
          Are you sure you want to finalize this invoice?
        </p>
        <p className="text-muted mb-0">
          <strong>Note:</strong> Once finalized, this invoice cannot be edited
          or modified. Please ensure all details are correct before proceeding.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline-secondary"
          onClick={onCancel}
          disabled={isFinalizing}
          aria-label="Cancel finalization"
        >
          Cancel
        </Button>
        <Button
          autoFocus
          variant="primary"
          onClick={onConfirm}
          disabled={isFinalizing}
          aria-label="Confirm finalization"
          aria-busy={isFinalizing}
        >
          {isFinalizing ? 'Finalizing...' : 'Finalize Invoice'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default FinalizeInvoiceDialog
