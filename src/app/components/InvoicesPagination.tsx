/**
 * Pagination component for invoices list
 * Displays current page info and navigation buttons
 */

import React from 'react'
import { Button, Card } from 'react-bootstrap'

interface Pagination {
  page: number
  page_size: number
  total_pages: number
  total_entries: number
}

interface InvoicesPaginationProps {
  pagination: Pagination | null
  currentPage: number
  onPageChange: (page: number) => void
  isLoading: boolean
}

const InvoicesPagination: React.FC<InvoicesPaginationProps> = ({
  pagination,
  currentPage,
  onPageChange,
  isLoading,
}) => {
  if (!pagination) {
    return null
  }

  return (
    <Card className="mt-3 shadow-sm" style={{ borderRadius: '0.75rem' }}>
      <div
        className="d-flex justify-content-between align-items-center p-3"
        style={{ backgroundColor: '#f8fafc' }}
      >
        <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
          Page {currentPage} of {pagination.total_pages} ·{' '}
          {pagination.total_entries} invoice
          {pagination.total_entries !== 1 ? 's' : ''}
        </span>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
          >
            Previous
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pagination.total_pages || isLoading}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default InvoicesPagination
