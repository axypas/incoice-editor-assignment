/**
 * Enhanced InvoicesList component (US1, US2)
 * Displays invoices in a well-formatted table with sorting, filtering, and actions
 * Supports filtering by date range, due date range, status, payment, customer, and product
 */

import React, { useState, useCallback } from 'react'
import { Spinner, Alert, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useInvoices } from 'app/features/InvoicesList/hooks/useInvoices'
import {
  useInvoiceFilters,
  type StatusFilter,
  type PaymentFilter,
} from 'app/features/InvoicesList/hooks/useInvoiceFilters'
import { useInvoiceSort } from 'app/features/InvoicesList/hooks/useInvoiceSort'
import { useInvoiceDelete } from 'app/features/InvoicesList/hooks/useInvoiceDelete'
import { useInvoiceFinalizeDialog } from 'app/features/InvoicesList/hooks/useInvoiceFinalizeDialog'
import { useInvoiceListToasts } from 'app/features/InvoicesList/hooks/useInvoiceListToasts'
import InvoicesPagination from 'app/features/InvoicesList/components/InvoicesPagination'
import DeleteInvoiceDialog from 'app/features/InvoicesList/components/DeleteInvoiceDialog'
import FinalizeInvoiceDialog from 'app/features/InvoicesList/components/FinalizeInvoiceDialog'
import InvoicesTable from 'app/features/InvoicesList/components/InvoicesTable'
import InvoicesFilters from 'app/features/InvoicesList/components/InvoicesFilters'
import InvoicesEmptyState from 'app/features/InvoicesList/components/InvoicesEmptyState'
import ToastNotifications from 'app/features/InvoicesList/components/ToastNotifications'

const InvoicesList = (): React.ReactElement => {
  const navigate = useNavigate()

  // Filter state managed via custom hook
  const {
    filterControl,
    handleFilterSubmit: handleFilterFormSubmit,
    handleClearFilters,
    activeFilters,
    hasActiveFilters,
    hasChangedFilters,
    filterSummary,
    currentFilters,
    setFilterValue,
  } = useInvoiceFilters()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 10

  // Sort state managed via custom hook
  const { sortField, sortDirection, sortParam, handleSort } = useInvoiceSort()

  // Fetch invoices with active filters, sorting, and pagination
  // The hook auto-fetches when filters, sort, page, or perPage change
  const { invoices, pagination, isLoading, isError, error, refetch } =
    useInvoices({
      filters: activeFilters,
      page: currentPage,
      perPage,
      sort: sortParam,
    })

  // Delete state managed via custom hook
  const {
    invoiceToDelete,
    showDeleteDialog,
    isDeleting,
    toastState,
    liveRegionMessage,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    setToastShow,
  } = useInvoiceDelete(refetch)

  // Finalize state managed via custom hook
  const {
    invoiceToFinalize,
    showFinalizeDialog,
    isFinalizing,
    finalizeToast,
    handleFinalizeClick,
    handleFinalizeConfirm,
    handleFinalizeCancel,
    setFinalizeToast,
  } = useInvoiceFinalizeDialog(refetch)

  // Toast notifications managed via custom hook
  const { saveToast, setSaveToast } = useInvoiceListToasts()

  // Handle status filter change
  const handleStatusChange = useCallback(
    (value: StatusFilter) => {
      setFilterValue('status', value, { shouldDirty: true })
    },
    [setFilterValue]
  )

  // Handle payment filter change
  const handlePaymentChange = useCallback(
    (value: PaymentFilter) => {
      setFilterValue('payment', value, { shouldDirty: true })
    },
    [setFilterValue]
  )

  // Wrap filter submit to also reset page
  const handleFilterSubmit = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      await handleFilterFormSubmit(e)
      setCurrentPage(1) // Reset to first page when filters change
    },
    [handleFilterFormSubmit]
  )

  // Wrap clear filters to also reset page
  const handleClearFiltersWithPageReset = useCallback(() => {
    handleClearFilters()
    setCurrentPage(1) // Reset to first page when filters are cleared
  }, [handleClearFilters])

  // Error state
  if (isError) {
    return (
      <Alert variant="danger" className="mt-4">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error?.message || 'Unable to load invoices. Please try again.'}</p>
        <Button variant="outline-danger" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </Alert>
    )
  }

  // Loading state on initial load - prevent flash of empty state
  if (isLoading && invoices.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center mt-5 py-5">
        <Spinner animation="border" role="status" className="me-2">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <span>Loading invoices...</span>
      </div>
    )
  }

  // Table view with filters and data
  return (
    <div className="pb-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
        <div>
          <h2 className="mb-1">Invoices</h2>
          <p className="text-muted mb-0">Manage and track all your invoices</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/invoices/new')}
          className="min-w-37.5"
        >
          + Create Invoice
        </Button>
      </div>

      {/* Filter controls */}
      <InvoicesFilters
        filterControl={filterControl}
        onSubmit={handleFilterSubmit}
        onClearFilters={handleClearFiltersWithPageReset}
        currentFilters={currentFilters}
        onStatusChange={handleStatusChange}
        onPaymentChange={handlePaymentChange}
        hasActiveFilters={hasActiveFilters}
        hasChangedFilters={hasChangedFilters}
        filterSummary={filterSummary}
      />

      {invoices.length === 0 ? (
        <InvoicesEmptyState
          onCreateInvoice={() => navigate('/invoices/new')}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <>
          <InvoicesTable
            invoices={invoices}
            isLoading={isLoading}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onDeleteClick={handleDeleteClick}
            onFinalizeClick={handleFinalizeClick}
          />

          {/* Pagination Footer */}
          <InvoicesPagination
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        </>
      )}

      <DeleteInvoiceDialog
        invoice={invoiceToDelete}
        show={showDeleteDialog}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />

      <FinalizeInvoiceDialog
        invoice={invoiceToFinalize}
        show={showFinalizeDialog}
        onConfirm={handleFinalizeConfirm}
        onCancel={handleFinalizeCancel}
        isFinalizing={isFinalizing}
      />

      <ToastNotifications
        deleteToast={toastState}
        onDeleteToastClose={() => setToastShow(false)}
        finalizeToast={finalizeToast}
        onFinalizeToastClose={() =>
          setFinalizeToast({ ...finalizeToast, show: false })
        }
        saveToast={saveToast}
        onSaveToastClose={() => setSaveToast({ ...saveToast, show: false })}
      />

      {/* Live region for accessibility announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="visually-hidden"
      >
        {liveRegionMessage}
      </div>
    </div>
  )
}

export default InvoicesList
