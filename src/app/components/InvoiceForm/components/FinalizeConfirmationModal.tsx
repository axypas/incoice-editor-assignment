/**
 * FinalizeConfirmationModal component
 * Confirmation dialog for finalizing an invoice
 * Once finalized, an invoice cannot be edited
 */
import React from 'react'
import { Modal, Button } from 'react-bootstrap'

interface FinalizeConfirmationModalProps {
  show: boolean
  isEditMode: boolean
  onConfirm: () => void
  onCancel: () => void
}

const FinalizeConfirmationModal: React.FC<FinalizeConfirmationModalProps> = ({
  show,
  isEditMode,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditMode
            ? 'Save and Finalize Invoice'
            : 'Create and Finalize Invoice'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to finalize this invoice?</p>
        <p className="text-muted mb-0">
          <strong>Note:</strong> Once finalized, this invoice cannot be edited
          or modified. Please ensure all details are correct before proceeding.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          {isEditMode ? 'Save and Finalize' : 'Create and Finalize'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default FinalizeConfirmationModal
