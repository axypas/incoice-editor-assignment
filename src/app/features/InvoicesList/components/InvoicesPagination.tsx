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

const InvoicesPagination = ({
  pagination,
  currentPage,
  onPageChange,
  isLoading,
}: InvoicesPaginationProps): JSX.Element | null => {
  if (!pagination) {
    return null
  }

  return (
    <Card className="mt-3 shadow-sm rounded-xl">
      <div className="d-flex justify-content-between align-items-center p-3 bg-slate-50">
        <span className="text-secondary text-sm">
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
            className="text-xs !py-1 !px-3"
          >
            Previous
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pagination.total_pages || isLoading}
            className="text-xs !py-1 !px-3"
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default InvoicesPagination
