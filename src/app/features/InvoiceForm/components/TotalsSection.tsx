/**
 * TotalsSection component
 * Displays invoice totals breakdown (subtotal, VAT, grand total)
 */

import { Card, Row, Col } from 'react-bootstrap'
import { formatCurrency } from 'common/utils/calculations'

interface InvoiceTotals {
  subtotal: number
  vatBreakdown: Record<string, number>
  totalVat: number
  grandTotal: number
}

interface TotalsSectionProps {
  totals: InvoiceTotals
}

const TotalsSection = ({ totals }: TotalsSectionProps): JSX.Element => {
  return (
    <Card className="mb-4 shadow-sm rounded-xl">
      <Card.Body className="p-4">
        <h3 className="mb-3 h5">Totals</h3>
        <Row>
          <Col md={{ span: 6, offset: 6 }}>
            <div className="d-flex justify-content-between mb-2">
              <span>Taxable Amount:</span>
              <strong>{formatCurrency(totals.subtotal)}</strong>
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
