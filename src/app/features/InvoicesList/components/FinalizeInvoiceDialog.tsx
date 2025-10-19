/**
 * FinalizeInvoiceDialog component
 * Confirmation dialog for finalizing an invoice from the table
 */
import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import { Invoice } from 'common/types/invoice.types'

interface FinalizeInvoiceDialogProps {
  invoice: Invoice | null
  show: boolean
  onConfirm: () => void
  onCancel: () => void
  isFinalizing: boolean
}

const FinalizeInvoiceDialog: React.FC<FinalizeInvoiceDialogProps> = ({
  invoice,
  show,
  onConfirm,
  onCancel,
  isFinalizing,
}) => {
  if (!invoice) return null

  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>Finalize Invoice #{invoice.id}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to finalize this invoice?</p>
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
        >
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={isFinalizing}>
          {isFinalizing ? 'Finalizing...' : 'Finalize Invoice'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default FinalizeInvoiceDialog
