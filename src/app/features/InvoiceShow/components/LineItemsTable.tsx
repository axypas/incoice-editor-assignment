/**
 * LineItemsTable component
 * Displays invoice line items in a table format
 */

import React from 'react'
import { Card, Table } from 'react-bootstrap'
import type { Invoice } from 'common/types/invoice.types'
import { formatCurrency } from 'common/utils/calculations'

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
                const unitPrice = line.unit_price ?? 0
                const vatRate =
                  typeof line.vat_rate === 'number'
                    ? line.vat_rate
                    : parseFloat(String(line.vat_rate)) || 0
                const lineTotal = quantity * unitPrice * (1 + vatRate / 100)
                const lineTax = quantity * unitPrice * (vatRate / 100)
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
