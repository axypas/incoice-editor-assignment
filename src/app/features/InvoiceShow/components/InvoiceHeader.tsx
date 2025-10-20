/**
 * InvoiceHeader component
 * Displays invoice title, status badges, and action buttons
 */

import React from 'react'
import { Badge, Button } from 'react-bootstrap'
import type { Invoice } from 'common/types/invoice.types'

interface InvoiceHeaderProps {
  invoice: Invoice
  onEdit: () => void
  onBackToList: () => void
}

const InvoiceHeader = ({
  invoice,
  onEdit,
  onBackToList,
}: InvoiceHeaderProps): JSX.Element => {
  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2>Invoice #{invoice.id}</h2>
        {invoice.finalized ? (
          <Badge bg="success" className="mt-2">
            Finalized
          </Badge>
        ) : (
          <Badge bg="secondary" className="mt-2">
            Draft
          </Badge>
        )}
      </div>
      <div className="d-flex gap-2">
        {!invoice.finalized && (
          <Button variant="primary" onClick={onEdit}>
            Edit Invoice
          </Button>
        )}
        <Button variant="outline-dark" onClick={onBackToList}>
          Back to List
        </Button>
      </div>
    </div>
  )
}

export default InvoiceHeader
