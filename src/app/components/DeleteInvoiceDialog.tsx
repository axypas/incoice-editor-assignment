/**
 * DeleteInvoiceDialog - Destructive confirmation dialog for invoice deletion
 * Features: focus trapping, keyboard support (Escape/Enter), clear messaging
 */
import { useRef, useEffect } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { Invoice } from '../../types/invoice.types'

interface Props {
  invoice: Invoice | null
  show: boolean
  onConfirm: () => void
  onCancel: () => void
  isDeleting?: boolean
}

const DeleteInvoiceDialog = ({
  invoice,
  show,
  onConfirm,
  onCancel,
  isDeleting = false,
}: Props) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Handle Enter key to confirm deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (show && e.key === 'Enter' && !isDeleting) {
        e.preventDefault()
        onConfirm()
      }
    }

    if (show) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [show, onConfirm, isDeleting])

  // Focus confirm button when dialog opens
  useEffect(() => {
    if (show && confirmButtonRef.current) {
      confirmButtonRef.current.focus()
    }
  }, [show])

  if (!invoice) return null

  return (
    <Modal
      show={show}
      onHide={onCancel}
      centered
      backdrop="static"
      keyboard={!isDeleting}
      aria-labelledby="delete-invoice-dialog-title"
    >
      <Modal.Header closeButton={!isDeleting}>
        <Modal.Title id="delete-invoice-dialog-title">
          Delete Invoice
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>
          Are you sure you want to delete invoice{' '}
          <strong>#{invoice.invoice_number}</strong>?
        </p>
        <p className="text-muted mb-0">This action cannot be undone.</p>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isDeleting}
          aria-label="Cancel deletion"
        >
          Cancel
        </Button>
        <Button
          ref={confirmButtonRef}
          variant="danger"
          onClick={onConfirm}
          disabled={isDeleting}
          aria-label="Confirm deletion"
        >
          {isDeleting ? 'Deleting...' : 'Delete Invoice'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default DeleteInvoiceDialog
