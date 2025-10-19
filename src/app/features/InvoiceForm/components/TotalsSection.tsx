/**
 * TotalsSection component
 * Displays invoice totals breakdown (subtotal, discount, VAT, grand total)
 */

import React from 'react'
import { Card, Row, Col } from 'react-bootstrap'
import { formatCurrency } from 'common/utils/calculations'

interface InvoiceTotals {
  subtotal: number
  totalDiscount: number
  taxableAmount: number
  vatBreakdown: Record<string, number>
  totalVat: number
  grandTotal: number
}

interface TotalsSectionProps {
  totals: InvoiceTotals
}

const TotalsSection: React.FC<TotalsSectionProps> = ({ totals }) => {
  return (
    <Card className="mb-4 shadow-sm" style={{ borderRadius: '0.75rem' }}>
      <Card.Body className="p-4">
        <h5 className="mb-3">Totals</h5>
        <Row>
          <Col md={{ span: 6, offset: 6 }}>
            <div className="d-flex justify-content-between mb-2">
              <span>Subtotal:</span>
              <strong>{formatCurrency(totals.subtotal)}</strong>
            </div>
            {totals.totalDiscount > 0 && (
              <div className="d-flex justify-content-between mb-2 text-success">
                <span>Discount:</span>
                <strong>-{formatCurrency(totals.totalDiscount)}</strong>
              </div>
            )}
            <div className="d-flex justify-content-between mb-2">
              <span>Taxable Amount:</span>
              <strong>{formatCurrency(totals.taxableAmount)}</strong>
            </div>
            {Object.entries(totals.vatBreakdown).map(([rate, amount]) => (
              <div
                key={rate}
                className="d-flex justify-content-between mb-2 text-muted"
              >
                <span className="small">VAT {rate}%:</span>
                <span className="small">{formatCurrency(amount)}</span>
              </div>
            ))}
            <div className="d-flex justify-content-between mb-2">
              <span>Total VAT:</span>
              <strong>{formatCurrency(totals.totalVat)}</strong>
            </div>
            <hr />
            <div className="d-flex justify-content-between">
              <strong className="h5">Grand Total:</strong>
              <strong className="h5">
                {formatCurrency(totals.grandTotal)}
              </strong>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}

export default TotalsSection
