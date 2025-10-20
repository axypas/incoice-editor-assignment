/**
 * FinalizeConfirmationModal component
 * Confirmation dialog for finalizing an invoice
 * Once finalized, an invoice cannot be edited
 */
import { Modal, Button } from 'react-bootstrap'

interface FinalizeConfirmationModalProps {
  show: boolean
  isEditMode: boolean
  onConfirm: () => void
  onCancel: () => void
}

const FinalizeConfirmationModal = ({
  show,
  isEditMode,
  onConfirm,
  onCancel,
}: FinalizeConfirmationModalProps): JSX.Element => {
  // Keyboard handler for Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onConfirm()
    }
  }

  const modalTitle = isEditMode
    ? 'Save and Finalize Invoice'
    : 'Create and Finalize Invoice'
  const confirmButtonText = isEditMode
    ? 'Save and Finalize'
    : 'Create and Finalize'

  return (
    <Modal
      show={show}
      onHide={onCancel}
      centered
      aria-labelledby="finalize-confirmation-modal-title"
      aria-describedby="finalize-confirmation-modal-description"
      keyboard
      onKeyDown={handleKeyDown}
    >
      <Modal.Header closeButton>
        <Modal.Title id="finalize-confirmation-modal-title">
          {modalTitle}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p id="finalize-confirmation-modal-description">
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
          aria-label="Cancel finalization"
        >
          Cancel
        </Button>
        <Button
          autoFocus
          variant="primary"
          onClick={onConfirm}
          aria-label={`Confirm ${modalTitle.toLowerCase()}`}
        >
          {confirmButtonText}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default FinalizeConfirmationModal
