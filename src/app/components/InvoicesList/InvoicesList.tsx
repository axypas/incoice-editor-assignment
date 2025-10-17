/**
 * Enhanced InvoicesList component (US1, US2)
 * Displays invoices in a well-formatted table with sorting, filtering, and actions
 * Uses react-table for table functionality
 * Supports filtering by date range, due date range, status, payment, customer, and product
 *
 * NOTE: Invoice number/ID filtering was removed because the backend API does not support
 * the 'start_with' operator on the 'id' field. The API only supports exact match ('eq')
 * for ID filtering, which is not useful for user search scenarios.
 */

import { Invoice, InvoiceFilter } from 'types/invoice.types'
import { Customer, Product } from 'types'
import React, { useState, useMemo, FormEvent, useCallback } from 'react'
import {
  useTable,
  useSortBy,
  useExpanded,
  Column,
  CellProps,
  UseSortByColumnProps,
  UseExpandedRowProps,
  HeaderGroup,
  TableState,
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
} from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useInvoices } from 'hooks/useInvoices'
import {
  formatCurrency,
  formatDate,
  getPaymentStatusLabel,
} from 'utils/currency'
import { calculateLineItem } from 'utils/calculations'
import CustomerAutocomplete from 'app/components/CustomerAutocomplete'
import ProductAutocomplete from 'app/components/ProductAutocomplete'

type ColumnWithSort<D extends object> = HeaderGroup<D> & UseSortByColumnProps<D>

type StatusFilter = 'all' | 'draft' | 'finalized'
type PaymentFilter = 'all' | 'paid' | 'unpaid'

interface FilterFormData {
  dateRange: [Date | null, Date | null]
  dueDateRange: [Date | null, Date | null]
  status: StatusFilter
  payment: PaymentFilter
  customer: Customer | null
  product: Product | null
}

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
  // Filter state
  const [filterForm, setFilterForm] = useState<FilterFormData>({
    dateRange: [null, null],
    dueDateRange: [null, null],
    status: 'all',
    payment: 'all',
    customer: null,
    product: null,
  })
  const [activeFilters, setActiveFilters] = useState<InvoiceFilter[]>([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 10

  // Fetch invoices with active filters and pagination
  // The hook auto-fetches when filters, page, or perPage change
  const { invoices, pagination, isLoading, isError, error, refetch } =
    useInvoices({
      filters: activeFilters,
      page: currentPage,
      perPage,
    })

  // Format date to YYYY-MM-DD for API
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Build filters based on current form state
  const buildFilters = useCallback(
    (formData: FilterFormData): InvoiceFilter[] => {
      const filters: InvoiceFilter[] = []

      const [startDate, endDate] = formData.dateRange
      const [dueDateStart, dueDateEnd] = formData.dueDateRange

      if (startDate) {
        filters.push({
          field: 'date',
          operator: 'gteq',
          value: formatDateForAPI(startDate),
        })
      }

      if (endDate) {
        filters.push({
          field: 'date',
          operator: 'lteq',
          value: formatDateForAPI(endDate),
        })
      }

      if (dueDateStart) {
        filters.push({
          field: 'deadline',
          operator: 'gteq',
          value: formatDateForAPI(dueDateStart),
        })
      }

      if (dueDateEnd) {
        filters.push({
          field: 'deadline',
          operator: 'lteq',
          value: formatDateForAPI(dueDateEnd),
        })
      }

      if (formData.status !== 'all') {
        filters.push({
          field: 'finalized',
          operator: 'eq',
          value: formData.status === 'finalized' ? 'true' : 'false',
        })
      }

      if (formData.payment !== 'all') {
        filters.push({
          field: 'paid',
          operator: 'eq',
          value: formData.payment === 'paid' ? 'true' : 'false',
        })
      }

      if (formData.customer) {
        filters.push({
          field: 'customer_id',
          operator: 'eq',
          value: formData.customer.id.toString(),
        })
      }

      if (formData.product) {
        filters.push({
          field: 'invoice_lines.product_id',
          operator: 'eq',
          value: formData.product.id.toString(),
        })
      }

      return filters
    },
    []
  )

  // Handle status filter change
  const handleStatusChange = useCallback(
    (value: StatusFilter) => {
      setFilterForm({ ...filterForm, status: value })
    },
    [filterForm]
  )

  // Handle payment filter change
  const handlePaymentChange = useCallback(
    (value: PaymentFilter) => {
      setFilterForm({ ...filterForm, payment: value })
    },
    [filterForm]
  )

  // Handle customer filter change
  const handleCustomerChange = useCallback(
    (customer: Customer | null) => {
      setFilterForm({ ...filterForm, customer })
    },
    [filterForm]
  )

  // Handle product filter change
  const handleProductChange = useCallback(
    (product: Product | null) => {
      setFilterForm({ ...filterForm, product })
    },
    [filterForm]
  )

  // Handle filter form submission
  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault()
    setActiveFilters(buildFilters(filterForm))
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    const resetForm: FilterFormData = {
      dateRange: [null, null],
      dueDateRange: [null, null],
      status: 'all',
      payment: 'all',
      customer: null,
      product: null,
    }
    setFilterForm(resetForm)
    setActiveFilters([])
    setCurrentPage(1) // Reset to first page when filters are cleared
  }, [])

  // Check if any filters are active
  const hasActiveFilters = activeFilters.length > 0

  // Compare two filter arrays for equality
  const areFiltersEqual = useCallback(
    (filters1: InvoiceFilter[], filters2: InvoiceFilter[]): boolean => {
      if (filters1.length !== filters2.length) return false

      // Sort both arrays by field, operator, and value for consistent comparison
      const sort = (f: InvoiceFilter[]) =>
        [...f].sort((a, b) => {
          const fieldCompare = a.field.localeCompare(b.field)
          if (fieldCompare !== 0) return fieldCompare
          const opCompare = a.operator.localeCompare(b.operator)
          if (opCompare !== 0) return opCompare
          return String(a.value).localeCompare(String(b.value))
        })

      const sorted1 = sort(filters1)
      const sorted2 = sort(filters2)

      return sorted1.every(
        (f1, idx) =>
          f1.field === sorted2[idx].field &&
          f1.operator === sorted2[idx].operator &&
          f1.value === sorted2[idx].value
      )
    },
    []
  )

  // Check if filter form values differ from currently active filters
  const hasChangedFilters = useMemo(() => {
    const formFilters = buildFilters(filterForm)
    return !areFiltersEqual(formFilters, activeFilters)
  }, [filterForm, activeFilters, buildFilters, areFiltersEqual])

  // Format active filter summary
  const getFilterSummary = () => {
    const parts: string[] = []

    if (filterForm.status !== 'all') {
      parts.push(`Status: ${filterForm.status}`)
    }
    if (filterForm.payment !== 'all') {
      parts.push(`Payment: ${filterForm.payment}`)
    }
    if (filterForm.customer) {
      const customerName =
        `${filterForm.customer.first_name} ${filterForm.customer.last_name}`.trim()
      parts.push(`Customer: ${customerName}`)
    }
    if (filterForm.product) {
      parts.push(`Product: ${filterForm.product.label}`)
    }

    activeFilters.forEach((f) => {
      if (f.field === 'date') {
        if (f.operator === 'gteq') {
          parts.push(`Date from ${f.value}`)
        }
        if (f.operator === 'lteq') {
          parts.push(`Date to ${f.value}`)
        }
      }
      if (f.field === 'deadline') {
        if (f.operator === 'gteq') {
          parts.push(`Due date from ${f.value}`)
        }
        if (f.operator === 'lteq') {
          parts.push(`Due date to ${f.value}`)
        }
      }
    })

    return parts.join(', ')
  }

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
              {customer.address && (
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {customer.address}
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
          const total = value || 0
          const isPaid = row.original.paid

          return (
            <span className="fw-semibold text-dark">
              {isPaid ? formatCurrency(total) : '—'}
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
              >
                Edit
              </Button>
            )}
            {invoice.finalized && (
              <Button
                variant="outline-secondary"
                size="sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
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
                variant="outline-secondary"
                size="sm"
                className="text-danger"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
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
    []
  )

  const tableInstance = useTable(
    {
      columns,
      data: invoices,
      // Type assertion needed because useSortBy plugin extends TableState with sortBy
      initialState: {
        sortBy: [{ id: 'date', desc: true }],
      } as unknown as Partial<TableState<Invoice>>,
    },
    useSortBy,
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
                  <DatePicker
                    selectsRange
                    startDate={filterForm.dateRange[0]}
                    endDate={filterForm.dateRange[1]}
                    onChange={(update: [Date | null, Date | null]) => {
                      setFilterForm({ ...filterForm, dateRange: update })
                    }}
                    placeholderText="Select date range"
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    isClearable
                    aria-describedby="dateRangeHelp"
                  />
                  <Form.Text id="dateRangeHelp" muted>
                    Filter by invoice date
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="dueDateRange">
                  <Form.Label>Due Date Range</Form.Label>
                  <DatePicker
                    selectsRange
                    startDate={filterForm.dueDateRange[0]}
                    endDate={filterForm.dueDateRange[1]}
                    onChange={(update: [Date | null, Date | null]) => {
                      setFilterForm({ ...filterForm, dueDateRange: update })
                    }}
                    placeholderText="Select due date range"
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    isClearable
                    aria-describedby="dueDateRangeHelp"
                  />
                  <Form.Text id="dueDateRangeHelp" muted>
                    Filter by payment deadline
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4} className="d-flex align-items-end gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!hasChangedFilters}
                >
                  Apply Filters
                </Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </Col>
            </BsRow>
            {hasActiveFilters && (
              <div className="mt-3">
                <small className="text-muted">
                  <strong>Active filters:</strong> {getFilterSummary()}
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
            <Button variant="outline-primary" onClick={handleClearFilters}>
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
        <Button variant="primary" className="mt-3">
          Create Invoice
        </Button>
      </div>
    )
  }

  // Table view with filters and data
  return (
    <div className="pb-4">
      {/* Filter controls */}
      <Form onSubmit={handleFilterSubmit} className="mt-4">
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
                        filterForm.status === option.value
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
                        filterForm.payment === option.value
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
                <CustomerAutocomplete
                  value={filterForm.customer}
                  onChange={handleCustomerChange}
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
                <ProductAutocomplete
                  value={filterForm.product}
                  onChange={handleProductChange}
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
                <DatePicker
                  selectsRange
                  startDate={filterForm.dateRange[0]}
                  endDate={filterForm.dateRange[1]}
                  onChange={(update: [Date | null, Date | null]) => {
                    setFilterForm({ ...filterForm, dateRange: update })
                  }}
                  placeholderText="Select date range"
                  dateFormat="yyyy-MM-dd"
                  className="form-control"
                  isClearable
                  aria-describedby="dateRangeHelp"
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
                <DatePicker
                  selectsRange
                  startDate={filterForm.dueDateRange[0]}
                  endDate={filterForm.dueDateRange[1]}
                  onChange={(update: [Date | null, Date | null]) => {
                    setFilterForm({ ...filterForm, dueDateRange: update })
                  }}
                  placeholderText="Select due date range"
                  dateFormat="yyyy-MM-dd"
                  className="form-control"
                  isClearable
                  aria-describedby="dueDateRangeHelp"
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
              <Button
                type="submit"
                variant="primary"
                disabled={!hasChangedFilters}
              >
                Apply Filters
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </Col>
          </BsRow>

          {hasActiveFilters && (
            <div className="mt-3">
              <small className="text-muted">
                <strong>Active filters:</strong> {getFilterSummary()}
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
                      const sortColumn = column as ColumnWithSort<Invoice>
                      return (
                        <th
                          {...column.getHeaderProps(
                            sortColumn.getSortByToggleProps()
                          )}
                          style={{
                            cursor: sortColumn.canSort ? 'pointer' : 'default',
                            padding: '0.75rem 1.25rem',
                            fontWeight: 500,
                            color: '#64748b',
                            borderBottom: '1px solid #e2e8f0',
                          }}
                          role={sortColumn.canSort ? 'button' : undefined}
                          tabIndex={sortColumn.canSort ? 0 : undefined}
                        >
                          {column.render('Header')}
                          {sortColumn.isSorted
                            ? sortColumn.isSortedDesc
                              ? ' ▼'
                              : ' ▲'
                            : ''}
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
      {pagination && (
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
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
              >
                Previous
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.total_pages || isLoading}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default InvoicesList
