/**
 * Enhanced InvoicesList component (US1, US2)
 * Displays invoices in a well-formatted table with sorting, filtering, and actions
 * Uses react-table for table functionality
 * Supports filtering by date range and invoice number
 */

import { Invoice, InvoiceFilter } from 'types/invoice.types'
import { Customer, Product } from 'types'
import { useState, useMemo, FormEvent, useCallback, useEffect } from 'react'
import {
  useTable,
  useSortBy,
  Column,
  CellProps,
  UseSortByColumnProps,
  HeaderGroup,
  TableState,
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
  ButtonGroup,
  Card,
} from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useInvoices } from 'hooks/useInvoices'
import {
  formatCurrency,
  formatDate,
  formatInvoiceNumber,
  getPaymentStatusLabel,
} from 'utils/currency'
import CustomerAutocomplete from 'app/components/CustomerAutocomplete'
import ProductAutocomplete from 'app/components/ProductAutocomplete'

type ColumnWithSort<D extends object> = HeaderGroup<D> & UseSortByColumnProps<D>

type StatusFilter = 'all' | 'draft' | 'finalized'
type PaymentFilter = 'all' | 'paid' | 'unpaid'

interface FilterFormData {
  dateRange: [Date | null, Date | null]
  invoiceNumber: string
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
    invoiceNumber: '',
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
  const { invoices, pagination, isLoading, isError, error, refetch } =
    useInvoices({
      filters: activeFilters,
      page: currentPage,
      perPage,
    })

  // Refetch when page changes
  useEffect(() => {
    refetch(currentPage, perPage)
  }, [currentPage, perPage, refetch])

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

      if (formData.invoiceNumber.trim()) {
        filters.push({
          field: 'invoice_number',
          operator: 'start_with',
          value: formData.invoiceNumber.trim(),
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
      invoiceNumber: '',
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
      if (f.field === 'invoice_number') {
        parts.push(`Invoice # starts with "${f.value}"`)
      }
    })

    return parts.join(', ')
  }

  // Define table columns
  const columns: Column<Invoice>[] = useMemo(
    () => [
      {
        Header: 'Invoice #',
        accessor: 'id',
        Cell: ({ value }: CellProps<Invoice, string | undefined>) => (
          <span className="font-monospace">
            {formatInvoiceNumber(value || '')}
          </span>
        ),
      },
      {
        Header: 'Customer',
        accessor: (row) =>
          row.customer
            ? `${row.customer.first_name || ''} ${
                row.customer.last_name || ''
              }`.trim()
            : '',
        Cell: ({ value }: CellProps<Invoice, string>) => <>{value || '—'}</>,
        id: 'customer',
      },
      {
        Header: 'Date',
        accessor: 'date',
        Cell: ({ value }: CellProps<Invoice, string>) => (
          <>{value ? formatDate(value) : '—'}</>
        ),
      },
      {
        Header: 'Due Date',
        accessor: 'deadline',
        Cell: ({ value, row }: CellProps<Invoice, string | undefined>) => {
          const isOverdue =
            !row.original.paid && value && new Date(value) < new Date()

          return (
            <span className={isOverdue ? 'text-danger fw-bold' : ''}>
              {value ? formatDate(value) : '—'}
              {isOverdue && ' ⚠️'}
            </span>
          )
        },
      },
      {
        Header: 'Amount',
        accessor: 'total',
        Cell: ({ value }: CellProps<Invoice, number | undefined>) => {
          const total = value || 0
          return (
            <span className="text-end font-monospace d-block">
              {formatCurrency(total)}
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
        Header: 'Actions',
        accessor: (row) => row,
        Cell: ({ value: invoice }: CellProps<Invoice, Invoice>) => (
          <div className="btn-group btn-group-sm" role="group">
            {!invoice.finalized && (
              <Button variant="outline-primary" size="sm">
                Edit
              </Button>
            )}
            {invoice.finalized && (
              <Button variant="outline-secondary" size="sm">
                View
              </Button>
            )}
            {!invoice.finalized && (
              <Button variant="outline-success" size="sm">
                Finalize
              </Button>
            )}
            {!invoice.finalized && (
              <Button variant="outline-danger" size="sm">
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
    useSortBy
  )

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance

  // Loading state
  if (isLoading) {
    return (
      <div className="mt-4">
        <div className="d-flex align-items-center">
          <Spinner animation="border" size="sm" role="status" className="me-2">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <span>Loading invoices...</span>
        </div>
      </div>
    )
  }

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

  // Empty state - distinguish between no invoices and no filtered results
  if (invoices.length === 0) {
    if (hasActiveFilters) {
      // Filtered empty state
      return (
        <div>
          {/* Filter controls */}
          <Form onSubmit={handleFilterSubmit} className="mt-4">
            <BsRow className="g-3 align-items-end">
              <Col md={5}>
                <Form.Group controlId="dateRange">
                  <Form.Label>Date Range</Form.Label>
                  <DatePicker
                    selectsRange
                    startDate={filterForm.dateRange[0]}
                    endDate={filterForm.dateRange[1]}
                    onChange={(update: [Date | null, Date | null]) => {
                      console.log('DatePicker onChange:', update)
                      setFilterForm({ ...filterForm, dateRange: update })
                    }}
                    placeholderText="Select date range"
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    isClearable
                    aria-describedby="dateRangeHelp"
                  />
                  <Form.Text id="dateRangeHelp" muted>
                    Filter invoices by date range
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="invoiceNumber">
                  <Form.Label>Invoice Number</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search by number"
                    value={filterForm.invoiceNumber}
                    onChange={(e) =>
                      setFilterForm({
                        ...filterForm,
                        invoiceNumber: e.target.value,
                      })
                    }
                    aria-describedby="invoiceNumberHelp"
                  />
                  <Form.Text id="invoiceNumberHelp" muted>
                    Search for invoices starting with this text
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={3}>
                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary">
                    Apply Filters
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={handleClearFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
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
    <div>
      {/* Filter controls */}
      <Form onSubmit={handleFilterSubmit} className="mt-4">
        <Card className="p-3">
          <BsRow className="g-3">
            <Col md={6} lg={3}>
              <Form.Group controlId="status">
                <Form.Label className="text-uppercase small fw-semibold text-muted">
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
            <Col md={6} lg={3}>
              <Form.Group controlId="payment">
                <Form.Label className="text-uppercase small fw-semibold text-muted">
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
            <Col md={6} lg={3}>
              <Form.Group controlId="customer">
                <Form.Label className="text-uppercase small fw-semibold text-muted">
                  Customer
                </Form.Label>
                <CustomerAutocomplete
                  value={filterForm.customer}
                  onChange={handleCustomerChange}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group controlId="product">
                <Form.Label className="text-uppercase small fw-semibold text-muted">
                  Product
                </Form.Label>
                <ProductAutocomplete
                  value={filterForm.product}
                  onChange={handleProductChange}
                />
              </Form.Group>
            </Col>
          </BsRow>

          <BsRow className="g-3 mt-2">
            <Col md={5}>
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
                  Filter invoices by date range
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="invoiceNumber">
                <Form.Label>Invoice Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by number"
                  value={filterForm.invoiceNumber}
                  onChange={(e) =>
                    setFilterForm({
                      ...filterForm,
                      invoiceNumber: e.target.value,
                    })
                  }
                  aria-describedby="invoiceNumberHelp"
                />
                <Form.Text id="invoiceNumberHelp" muted>
                  Search for invoices starting with this text
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end gap-2">
              <Button type="submit" variant="primary">
                Apply Filters
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={handleClearFilters}
                >
                  Reset
                </Button>
              )}
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
      <div className="mt-4">
        <Table {...getTableProps()} hover responsive>
          <thead className="table-light">
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
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
          <div className="text-muted small">
            Page {currentPage} of {pagination.total_pages} ·{' '}
            {pagination.total_entries} invoice
            {pagination.total_entries !== 1 ? 's' : ''}
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.total_pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoicesList
