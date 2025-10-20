/**
 * LineItemsTable component
 * Displays invoice line items in a table format
 */

import { Card, Table } from 'react-bootstrap'
import type { Invoice } from 'common/types/invoice.types'
import { formatCurrency } from 'common/utils/calculations'
import numeral from 'numeral'

interface LineItemsTableProps {
  invoice: Invoice
}

const LineItemsTable = ({ invoice }: LineItemsTableProps): JSX.Element => {
  return (
    <Card className="mb-4">
      <Card.Header>
        <h3 className="mb-0 h5">Line Items</h3>
      </Card.Header>
      <Card.Body className="p-0">
        <Table responsive className="mb-0">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Label</th>
              <th scope="col" className="text-center">
                Quantity
              </th>
              <th scope="col">Unit</th>
              <th scope="col" className="text-end">
                Unit Price
              </th>
              <th scope="col" className="text-center">
                VAT Rate
              </th>
              <th scope="col" className="text-end">
                Tax
              </th>
              <th scope="col" className="text-end">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.invoice_lines && invoice.invoice_lines.length > 0 ? (
              invoice.invoice_lines.map((line, index) => {
                const quantity = line.quantity ?? 0
                // BE uses 'price' field (string), not 'unit_price'
                const unitPrice = numeral(line.price).value() || 0
                const vatRate =
                  typeof line.vat_rate === 'string'
                    ? numeral(line.vat_rate).value()
                    : line.vat_rate || 0

                // Calculate subtotal: quantity × unitPrice
                const subtotal =
                  numeral(quantity).multiply(unitPrice).value() ?? 0

                // Calculate tax: subtotal × (vatRate / 100)
                const lineTax =
                  numeral(subtotal).multiply(vatRate).divide(100).value() ?? 0

                // Calculate total: subtotal + lineTax
                const lineTotal = numeral(subtotal).add(lineTax).value() ?? 0

                return (
                  <tr key={line.id || index}>
                    <td>{line.product?.label || 'N/A'}</td>
                    <td>{line.label}</td>
                    <td className="text-center">{quantity}</td>
                    <td>{line.unit}</td>
                    <td className="text-end">{formatCurrency(unitPrice)}</td>
                    <td className="text-center">{vatRate}%</td>
                    <td className="text-end">{formatCurrency(lineTax)}</td>
                    <td className="text-end fw-medium">
                      {formatCurrency(lineTotal)}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center text-muted">
                  No line items
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  )
}

export default LineItemsTable
