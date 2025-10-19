/**
 * InvoiceDetails component
 * Displays customer information, dates, and payment status
 */

import React from 'react'
import { Card, Badge } from 'react-bootstrap'
import type { Invoice } from 'common/types/invoice.types'

interface InvoiceDetailsProps {
  invoice: Invoice
  formatDate: (dateString: string | null | undefined) => string
}

const InvoiceDetails = ({
  invoice,
  formatDate,
}: InvoiceDetailsProps): JSX.Element => {
  return (
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
            <label className="form-label text-muted small">Invoice Date</label>
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
  )
}

export default InvoiceDetails
