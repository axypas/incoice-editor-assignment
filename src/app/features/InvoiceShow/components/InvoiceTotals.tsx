/**
 * InvoiceTotals component
 * Displays invoice totals summary (subtotal, VAT, grand total)
 */

import React from 'react'
import { Card } from 'react-bootstrap'
import { formatCurrency } from 'common/utils/calculations'

interface InvoiceTotalsProps {
  subtotal: number
  tax: number
  total: number
}

const InvoiceTotals: React.FC<InvoiceTotalsProps> = ({
  subtotal,
  tax,
  total,
}) => {
  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Totals</h5>
      </Card.Header>
      <Card.Body>
        <div className="row">
          <div className="col-md-6 ms-auto">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Subtotal:</span>
              <span className="fw-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Total VAT:</span>
              <span className="fw-medium">{formatCurrency(tax)}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between">
              <span className="fw-bold">Grand Total:</span>
              <span className="fw-bold fs-5">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

export default InvoiceTotals
