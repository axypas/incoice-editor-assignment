/**
 * InvoicesTable component
 * Displays invoices in a sortable table with expandable rows showing invoice lines
 */
import React, { useMemo, useCallback } from 'react'
import {
  useTable,
  useExpanded,
  Column,
  CellProps,
  UseExpandedRowProps,
  Row,
} from 'react-table'
import { Spinner, Button, Badge, Table, Card } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { Invoice } from 'types/invoice.types'
import {
  formatCurrency,
  formatDate,
  getPaymentStatusLabel,
} from 'utils/currency'
import { calculateLineItem } from 'utils/calculations'

interface InvoicesTableProps {
  invoices: Invoice[]
  isLoading: boolean
  sortField: string
  sortDirection: 'asc' | 'desc'
  onSort: (field: string) => void
  onDeleteClick: (invoice: Invoice) => void
}

const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  isLoading,
  sortField,
  sortDirection,
  onSort,
  onDeleteClick,
}) => {
  const navigate = useNavigate()

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
                onClick={() => onDeleteClick(invoice)}
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
    [onDeleteClick, navigate]
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

  return (
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
                          isSortable && onSort(column.id as string)
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
  )
}

export default InvoicesTable
