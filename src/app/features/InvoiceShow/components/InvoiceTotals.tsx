/**
 * InvoiceTotals component
 * Displays invoice totals summary (subtotal, VAT, grand total)
 */

import { Card } from 'react-bootstrap'
import numeral from 'numeral'
import { formatCurrency } from 'common/utils/calculations'

interface InvoiceTotalsProps {
  tax: string | null
  total: string | null
}

const InvoiceTotals = ({ tax, total }: InvoiceTotalsProps): JSX.Element => {
  // Parse string values from BE to numbers
  const taxNum = tax ? parseFloat(tax) : undefined
  const totalNum = total ? parseFloat(total) : undefined

  // Calculate subtotal from total and tax using numeral.js
  const subtotal =
    totalNum !== undefined && taxNum !== undefined
      ? numeral(totalNum).subtract(taxNum).value() ?? undefined
      : undefined

  return (
    <Card>
      <Card.Header>
        <h3 className="mb-0 h5">Totals</h3>
      </Card.Header>
      <Card.Body>
        <div className="row">
          <div className="col-md-6 ms-auto">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Subtotal:</span>
              <span className="fw-medium">
                {subtotal !== undefined ? formatCurrency(subtotal) : '—'}
              </span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Total VAT:</span>
              <span className="fw-medium">
                {taxNum !== undefined ? formatCurrency(taxNum) : '—'}
              </span>
            </div>
            <hr />
            <div className="d-flex justify-content-between">
              <span className="fw-bold">Grand Total:</span>
              <span className="fw-bold fs-5">
                {totalNum !== undefined ? formatCurrency(totalNum) : '—'}
              </span>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

export default InvoiceTotals
