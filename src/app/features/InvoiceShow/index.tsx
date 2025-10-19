/**
 * InvoiceShow component
 * Displays invoice details in read-only mode
 */

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Alert, Spinner, Table, Badge } from 'react-bootstrap'
import { useInvoice } from 'app/features/InvoicesList/hooks/useInvoices'
import { formatCurrency } from 'common/utils/calculations'

const InvoiceShow: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { invoice, isLoading, isError, error } = useInvoice(id || '')

  // Loading state
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center mt-5 py-5">
        <Spinner animation="border" role="status" className="me-2">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <span>Loading invoice...</span>
      </div>
    )
  }

  // Error state
  if (isError || !invoice) {
    return (
      <Alert variant="danger" className="mt-4">
        <Alert.Heading>Error Loading Invoice</Alert.Heading>
        <p>
          {error?.message || 'Unable to load invoice. Please try again later.'}
        </p>
        <Button variant="outline-danger" onClick={() => navigate('/')}>
          Back to List
        </Button>
      </Alert>
    )
  }

  const total = invoice.total ?? 0
  const tax = invoice.tax ?? 0
  const subtotal = total - tax

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Invoice #{invoice.invoice_number || invoice.id}</h2>
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
            <Button
              variant="primary"
              onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
            >
              Edit Invoice
            </Button>
          )}
          <Button variant="outline-secondary" onClick={() => navigate('/')}>
            Back to List
          </Button>
        </div>
      </div>

      {/* Invoice Details */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Invoice Details</h5>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label text-muted small">Customer</label>
              <div className="fw-medium">
                {invoice.customer
                  ? `${invoice.customer.first_name} ${invoice.customer.last_name}`
                  : 'N/A'}
              </div>
              {invoice.customer && (
                <div className="text-muted small mt-1">
                  {invoice.customer.address && (
                    <div>{invoice.customer.address}</div>
                  )}
                  {(invoice.customer.zip_code || invoice.customer.city) && (
                    <div>
                      {invoice.customer.zip_code} {invoice.customer.city}
                    </div>
                  )}
                  {invoice.customer.country && (
                    <div>{invoice.customer.country}</div>
                  )}
                </div>
              )}
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label text-muted small">
                Invoice Date
              </label>
              <div className="fw-medium">{formatDate(invoice.date)}</div>
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label text-muted small">
                Payment Deadline
              </label>
              <div className="fw-medium">{formatDate(invoice.deadline)}</div>
            </div>
            <div className="col-md-12">
              <label className="form-label text-muted small">
                Payment Status
              </label>
              <div>
                {invoice.paid ? (
                  <Badge bg="success">Paid</Badge>
                ) : (
                  <Badge bg="warning" text="dark">
                    Unpaid
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Line Items */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Line Items</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive className="mb-0">
            <thead>
              <tr>
                <th>Product</th>
                <th>Label</th>
                <th className="text-center">Quantity</th>
                <th>Unit</th>
                <th className="text-end">Unit Price</th>
                <th className="text-center">VAT Rate</th>
                <th className="text-end">Tax</th>
                <th className="text-end">Total</th>
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

      {/* Totals */}
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
    </div>
  )
}

export default InvoiceShow
