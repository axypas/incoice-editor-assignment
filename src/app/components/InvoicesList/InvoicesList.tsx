/**
 * Enhanced InvoicesList component (US1, US2)
 * Displays invoices in a well-formatted table with sorting, filtering, and actions
 * Uses react-table for table functionality
 * Supports filtering by date range, due date range, status, payment, customer, and product
 */

import { Invoice } from 'types/invoice.types'
import React, { useState, useMemo, useCallback } from 'react'
import {
  useTable,
  useExpanded,
  Column,
  CellProps,
  UseExpandedRowProps,
  Row,
} from 'react-table'
import {
  Spinner,
  Alert,
  Button,
  Badge,
  Table,
  Form,
  Row as BsRow,
  Col,
  Card,
  ButtonGroup,
  Toast,
  ToastContainer,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useNavigate } from 'react-router-dom'
import { useInvoices } from 'hooks/useInvoices'
import {
  formatCurrency,
  formatDate,
  getPaymentStatusLabel,
} from 'utils/currency'
import { calculateLineItem } from 'utils/calculations'
import CustomerAutocomplete from 'app/components/CustomerAutocomplete'
import ProductAutocomplete from 'app/components/ProductAutocomplete'
import DeleteInvoiceDialog from 'app/components/DeleteInvoiceDialog'
import { Controller } from 'react-hook-form'
import {
  useInvoiceFilters,
  type StatusFilter,
  type PaymentFilter,
} from 'hooks/useInvoiceFilters'
import { useInvoiceSort } from 'hooks/useInvoiceSort'
import { useInvoiceDelete } from 'hooks/useInvoiceDelete'
import InvoicesPagination from 'app/components/InvoicesPagination'

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'finalized', label: 'Finalized' },
]

const paymentOptions: Array<{ value: PaymentFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
]

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

  // Render expandable row content
  const renderRowSubComponent = useCallback(
    ({ row }: { row: Row<Invoice> & UseExpandedRowProps<Invoice> }) => {
      const invoice = row.original
      if (!invoice.invoice_lines || invoice.invoice_lines.length === 0) {
        return (
          <div className="p-3 text-muted">
            <em>No invoice lines</em>
          </div>
        )
      }

      return (
        <div className="p-3 bg-light">
          <h6 className="mb-3">Invoice Lines</h6>
          <Table size="sm" bordered>
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-end">Quantity</th>
                <th>Unit</th>
                <th className="text-end">Unit Price</th>
                <th className="text-end">VAT Rate</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.invoice_lines.map((line, idx) => {
                const lineCalculation = calculateLineItem(line)
                return (
                  <tr key={line.id || idx}>
                    <td>{line.label}</td>
                    <td className="text-end">{line.quantity}</td>
                    <td>{line.unit}</td>
                    <td className="text-end">
                      {formatCurrency(line.unit_price)}
                    </td>
                    <td className="text-end">{line.vat_rate}%</td>
                    <td className="text-end font-monospace">
                      {formatCurrency(lineCalculation.subtotal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      )
    },
    []
  )

  // Define table columns
  const columns: Column<Invoice>[] = useMemo(
    () => [
      {
        // Expander column
        id: 'expander',
        Header: () => null,
        Cell: ({ row }: CellProps<Invoice>) => {
          const expandRow = row as Row<Invoice> & UseExpandedRowProps<Invoice>
          return (
            <span
              {...expandRow.getToggleRowExpandedProps()}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              {expandRow.isExpanded ? '▼' : '▶'}
            </span>
          )
        },
        disableSortBy: true,
      },
      {
        Header: 'ID',
        accessor: 'id',
        Cell: ({ row }: CellProps<Invoice, string | undefined>) => {
          const invoice = row.original
          return (
            <div>
              <div className="fw-semibold text-dark">#{invoice.id || '—'}</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                {invoice.invoice_lines.length} line(s)
              </div>
            </div>
          )
        },
      },
      {
        Header: 'Customer',
        accessor: (row) =>
          row.customer
            ? `${row.customer.first_name || ''} ${
                row.customer.last_name || ''
              }`.trim()
            : '',
        Cell: ({ row }: CellProps<Invoice, string>) => {
          const customer = row.original.customer
          if (!customer) {
            return <span className="text-muted">—</span>
          }
          return (
            <div>
              <div className="fw-semibold text-dark">
                {customer.first_name} {customer.last_name}
              </div>
              {customer.email && (
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {customer.email}
                </div>
              )}
              {customer.address && (
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {customer.address}
                </div>
              )}
              {(customer.city || customer.zip_code || customer.country) && (
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {customer.city && <span>{customer.city}</span>}
                  {customer.country_code && (
                    <span>
                      {customer.city && ', '}
                      {customer.country_code}
                    </span>
                  )}
                </div>
              )}
              {customer.vat_number && (
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  VAT: {customer.vat_number}
                </div>
              )}
            </div>
          )
        },
        id: 'customer',
      },
      {
        Header: 'Date',
        accessor: 'date',
        Cell: ({ value }: CellProps<Invoice, string>) => (
          <span className="text-secondary">
            {value ? formatDate(value) : '—'}
          </span>
        ),
      },
      {
        Header: 'Due Date',
        accessor: 'deadline',
        Cell: ({ value, row }: CellProps<Invoice, string | undefined>) => {
          const isOverdue =
            !row.original.paid && value && new Date(value) < new Date()

          return (
            <span
              className={isOverdue ? 'text-danger fw-bold' : 'text-secondary'}
            >
              {value ? formatDate(value) : '—'}
              {isOverdue && ' ⚠️'}
            </span>
          )
        },
      },
      {
        Header: 'Amount',
        accessor: 'total',
        Cell: ({ value, row }: CellProps<Invoice, number | undefined>) => {
          const total = value

          return (
            <span className="fw-semibold text-dark">
              {total ? formatCurrency(total) : '—'}
            </span>
          )
        },
      },
      {
        Header: 'Status',
        accessor: 'finalized',
        Cell: ({ value, row }: CellProps<Invoice, boolean>) => {
          const paymentStatus = getPaymentStatusLabel(
            row.original.paid,
            row.original.deadline
          )

          return (
            <>
              <Badge bg={value ? 'success' : 'secondary'}>
                {value ? 'Finalized' : 'Draft'}
              </Badge>
              {row.original.paid && (
                <Badge bg="success" className="ms-1">
                  Paid
                </Badge>
              )}
              {!row.original.paid && value && (
                <Badge bg={paymentStatus.color} className="ms-1">
                  {paymentStatus.label}
                </Badge>
              )}
            </>
          )
        },
        id: 'status',
      },
      {
        Header: () => <div className="text-end">Actions</div>,
        accessor: (row) => row,
        Cell: ({ value: invoice }: CellProps<Invoice, Invoice>) => (
          <div className="d-flex justify-content-end gap-2">
            {!invoice.finalized && (
              <Button
                variant="outline-secondary"
                size="sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
              >
                Edit
              </Button>
            )}
            {invoice.finalized && (
              <Button
                variant="outline-secondary"
                size="sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                onClick={() => navigate(`/invoice/${invoice.id}`)}
              >
                View
              </Button>
            )}
            {!invoice.finalized && (
              <Button
                variant="primary"
                size="sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
              >
                Finalize
              </Button>
            )}
            {!invoice.finalized && (
              <Button
                variant="outline-danger"
                size="sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                onClick={() => handleDeleteClick(invoice)}
              >
                Delete
              </Button>
            )}
          </div>
        ),
        disableSortBy: true,
        id: 'actions',
      },
    ],
    [handleDeleteClick, navigate]
  )

  const tableInstance = useTable(
    {
      columns,
      data: invoices,
    },
    useExpanded
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns,
  } = tableInstance

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

  // Empty state - distinguish between no invoices and no filtered results
  if (invoices.length === 0) {
    if (hasActiveFilters) {
      // Filtered empty state
      return (
        <div>
          {/* Filter controls */}
          <Form onSubmit={handleFilterSubmit} className="mt-4">
            <BsRow className="g-3 align-items-end">
              <Col md={4}>
                <Form.Group controlId="dateRange">
                  <Form.Label>Date Range</Form.Label>
                  <Controller
                    name="dateRange"
                    control={filterControl}
                    render={({ field }) => (
                      <DatePicker
                        selectsRange
                        startDate={field.value?.[0] ?? null}
                        endDate={field.value?.[1] ?? null}
                        onChange={(update: [Date | null, Date | null]) =>
                          field.onChange(update)
                        }
                        placeholderText="Select date range"
                        dateFormat="yyyy-MM-dd"
                        className="form-control"
                        isClearable
                        aria-describedby="dateRangeHelp"
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  <Form.Text id="dateRangeHelp" muted>
                    Filter by invoice date
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="dueDateRange">
                  <Form.Label>Due Date Range</Form.Label>
                  <Controller
                    name="dueDateRange"
                    control={filterControl}
                    render={({ field }) => (
                      <DatePicker
                        selectsRange
                        startDate={field.value?.[0] ?? null}
                        endDate={field.value?.[1] ?? null}
                        onChange={(update: [Date | null, Date | null]) =>
                          field.onChange(update)
                        }
                        placeholderText="Select due date range"
                        dateFormat="yyyy-MM-dd"
                        className="form-control"
                        isClearable
                        aria-describedby="dueDateRangeHelp"
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  <Form.Text id="dueDateRangeHelp" muted>
                    Filter by payment deadline
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4} className="d-flex align-items-end gap-2">
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip id="apply-filters-tooltip">
                      Please select at least one filter to apply
                    </Tooltip>
                  }
                  show={!hasChangedFilters ? undefined : false}
                >
                  <span className="d-inline-block">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!hasChangedFilters}
                      style={{
                        pointerEvents: !hasChangedFilters ? 'none' : 'auto',
                      }}
                    >
                      Apply Filters
                    </Button>
                  </span>
                </OverlayTrigger>
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={handleClearFiltersWithPageReset}
                >
                  Clear Filters
                </Button>
              </Col>
            </BsRow>
            {hasActiveFilters && (
              <div className="mt-3">
                <small className="text-muted">
                  <strong>Active filters:</strong> {filterSummary}
                </small>
              </div>
            )}
          </Form>
          <div className="text-center mt-5 py-5">
            <h4 className="text-muted">No results match your filters</h4>
            <p className="text-muted">
              Try adjusting your filter criteria or clear filters to see all
              invoices
            </p>
            <Button
              variant="outline-primary"
              onClick={handleClearFiltersWithPageReset}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )
    }

    // No invoices at all
    return (
      <div className="text-center mt-5 py-5">
        <h4 className="text-muted">No invoices yet</h4>
        <p className="text-muted">Create your first invoice to get started</p>
        <Button
          variant="primary"
          className="mt-3"
          onClick={() => navigate('/invoices/new')}
        >
          Create Invoice
        </Button>
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
          style={{ minWidth: '150px' }}
        >
          + Create Invoice
        </Button>
      </div>

      {/* Filter controls */}
      <Form onSubmit={handleFilterSubmit}>
        <Card className="p-4 shadow-sm" style={{ borderRadius: '0.75rem' }}>
          {/* Line 1: Status and Payment */}
          <BsRow className="g-3">
            <Col md={6}>
              <Form.Group controlId="status">
                <Form.Label
                  className="text-uppercase small fw-semibold text-muted"
                  style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}
                >
                  Status
                </Form.Label>
                <ButtonGroup size="sm" className="d-flex">
                  {statusOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={
                        currentFilters.status === option.value
                          ? 'primary'
                          : 'outline-secondary'
                      }
                      onClick={() => handleStatusChange(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </ButtonGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="payment">
                <Form.Label
                  className="text-uppercase small fw-semibold text-muted"
                  style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}
                >
                  Payment
                </Form.Label>
                <ButtonGroup size="sm" className="d-flex">
                  {paymentOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={
                        currentFilters.payment === option.value
                          ? 'primary'
                          : 'outline-secondary'
                      }
                      onClick={() => handlePaymentChange(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </ButtonGroup>
              </Form.Group>
            </Col>
          </BsRow>

          {/* Line 2: Customer and Product */}
          <BsRow className="g-3 mt-2">
            <Col md={6}>
              <Form.Group controlId="customer">
                <Form.Label
                  className="text-uppercase small fw-semibold text-muted"
                  style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}
                >
                  Customer
                </Form.Label>
                <Controller
                  name="customer"
                  control={filterControl}
                  render={({ field }) => (
                    <CustomerAutocomplete
                      value={field.value}
                      onChange={(customer) => field.onChange(customer)}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="product">
                <Form.Label
                  className="text-uppercase small fw-semibold text-muted"
                  style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}
                >
                  Product
                </Form.Label>
                <Controller
                  name="product"
                  control={filterControl}
                  render={({ field }) => (
                    <ProductAutocomplete
                      value={field.value}
                      onChange={(product) => field.onChange(product)}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </Form.Group>
            </Col>
          </BsRow>

          {/* Line 3: Date Range and Due Date Range */}
          <BsRow className="g-3 mt-2">
            <Col md={6}>
              <Form.Group controlId="dateRange" className="flex flex-col">
                <Form.Label
                  className="text-uppercase small fw-semibold text-muted"
                  style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}
                >
                  Date Range
                </Form.Label>
                <Controller
                  name="dateRange"
                  control={filterControl}
                  render={({ field }) => (
                    <DatePicker
                      selectsRange
                      startDate={field.value?.[0] ?? null}
                      endDate={field.value?.[1] ?? null}
                      onChange={(update: [Date | null, Date | null]) =>
                        field.onChange(update)
                      }
                      placeholderText="Select date range"
                      dateFormat="yyyy-MM-dd"
                      className="form-control"
                      isClearable
                      aria-describedby="dateRangeHelp"
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <Form.Text id="dateRangeHelp" muted>
                  Filter by invoice date
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="dueDateRange" className="flex flex-col">
                <Form.Label
                  className="text-uppercase small fw-semibold text-muted"
                  style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}
                >
                  Due Date Range
                </Form.Label>
                <Controller
                  name="dueDateRange"
                  control={filterControl}
                  render={({ field }) => (
                    <DatePicker
                      selectsRange
                      startDate={field.value?.[0] ?? null}
                      endDate={field.value?.[1] ?? null}
                      onChange={(update: [Date | null, Date | null]) =>
                        field.onChange(update)
                      }
                      placeholderText="Select due date range"
                      dateFormat="yyyy-MM-dd"
                      className="form-control"
                      isClearable
                      aria-describedby="dueDateRangeHelp"
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <Form.Text id="dueDateRangeHelp" muted>
                  Filter by payment deadline
                </Form.Text>
              </Form.Group>
            </Col>
          </BsRow>

          {/* Line 4: Buttons */}
          <BsRow className="g-3 mt-3">
            <Col className="d-flex gap-2">
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="apply-filters-tooltip-main">
                    Please select at least one filter to apply
                  </Tooltip>
                }
                show={!hasChangedFilters ? undefined : false}
              >
                <span className="d-inline-block">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!hasChangedFilters}
                    style={{
                      pointerEvents: !hasChangedFilters ? 'none' : 'auto',
                    }}
                  >
                    Apply Filters
                  </Button>
                </span>
              </OverlayTrigger>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={handleClearFiltersWithPageReset}
              >
                Clear Filters
              </Button>
            </Col>
          </BsRow>

          {hasActiveFilters && (
            <div className="mt-3">
              <small className="text-muted">
                <strong>Active filters:</strong> {filterSummary}
              </small>
            </div>
          )}
        </Card>
      </Form>

      {/* Table */}
      <div className="mt-4" style={{ position: 'relative' }}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div className="d-flex align-items-center">
              <Spinner
                animation="border"
                size="sm"
                role="status"
                className="me-2"
              >
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <span>Loading invoices...</span>
            </div>
          </div>
        )}
        <Card
          className="overflow-hidden shadow-sm"
          style={{ borderRadius: '0.75rem' }}
        >
          <div className="table-responsive">
            <Table
              {...getTableProps()}
              className="mb-0"
              style={{ fontSize: '0.875rem' }}
            >
              <thead style={{ backgroundColor: '#f8fafc' }}>
                {headerGroups.map((headerGroup) => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column) => {
                      // Determine if column is sortable (all except expander, customer, and actions)
                      const isSortable =
                        column.id !== 'expander' &&
                        column.id !== 'customer' &&
                        column.id !== 'actions'
                      const isSorted = sortField === column.id
                      const sortIcon = isSorted
                        ? sortDirection === 'desc'
                          ? ' ▼'
                          : ' ▲'
                        : ''

                      return (
                        <th
                          {...column.getHeaderProps()}
                          onClick={() =>
                            isSortable && handleSort(column.id as string)
                          }
                          style={{
                            cursor: isSortable ? 'pointer' : 'default',
                            padding: '0.75rem 1.25rem',
                            fontWeight: 500,
                            color: '#64748b',
                            borderBottom: '1px solid #e2e8f0',
                          }}
                          role={isSortable ? 'button' : undefined}
                          tabIndex={isSortable ? 0 : undefined}
                        >
                          {column.render('Header')}
                          {sortIcon}
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()}>
                {rows.map((row) => {
                  prepareRow(row)
                  const expandedRow = row as Row<Invoice> &
                    UseExpandedRowProps<Invoice>
                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        {...row.getRowProps()}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                        }}
                        className="align-middle"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        {row.cells.map((cell) => (
                          <td
                            {...cell.getCellProps()}
                            style={{ padding: '1rem 1.25rem' }}
                          >
                            {cell.render('Cell')}
                          </td>
                        ))}
                      </tr>
                      {expandedRow.isExpanded && (
                        <tr>
                          <td
                            colSpan={visibleColumns.length}
                            style={{ padding: 0 }}
                          >
                            {renderRowSubComponent({ row: expandedRow })}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Pagination Footer */}
      <InvoicesPagination
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
      />

      {/* Delete Invoice Dialog */}
      <DeleteInvoiceDialog
        invoice={invoiceToDelete}
        show={showDeleteDialog}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />

      {/* Toast Notifications */}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 9999 }}
      >
        <Toast
          show={toastState.show}
          onClose={() => setToastShow(false)}
          delay={5000}
          autohide
          bg={toastState.variant}
        >
          <Toast.Header>
            <strong className="me-auto">
              {toastState.variant === 'success'
                ? 'Success'
                : toastState.variant === 'warning'
                ? 'Notice'
                : 'Error'}
            </strong>
          </Toast.Header>
          <Toast.Body
            className={toastState.variant === 'success' ? 'text-white' : ''}
          >
            {toastState.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

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
