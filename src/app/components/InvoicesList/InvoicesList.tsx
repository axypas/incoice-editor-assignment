/**
 * Enhanced InvoicesList component (US1)
 * Displays invoices in a well-formatted table with sorting and actions
 * Uses react-table for table functionality
 */

import { useApi } from 'api'
import { Invoice } from 'types'
import { useEffect, useCallback, useState, useMemo } from 'react'
import {
  useTable,
  useSortBy,
  Column,
  CellProps,
  Row,
  UseSortByColumnProps,
  HeaderGroup,
  TableState,
} from 'react-table'
import { logger } from 'utils/logger'
import {
  formatCurrency,
  formatDate,
  formatInvoiceNumber,
  getPaymentStatusLabel,
} from 'utils/currency'

interface InvoicesState {
  invoices: Invoice[]
  loading: boolean
  error: string | null
}

type ColumnWithSort<D extends object> = HeaderGroup<D> & UseSortByColumnProps<D>

const InvoicesList = (): React.ReactElement => {
  const api = useApi()

  const [state, setState] = useState<InvoicesState>({
    invoices: [],
    loading: true,
    error: null,
  })

  const fetchInvoices = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const { data } = await api.getInvoices()
      setState({
        invoices: data?.invoices || [],
        loading: false,
        error: null,
      })
    } catch (error) {
      logger.error('Failed to fetch invoices:', error)
      setState({
        invoices: [],
        loading: false,
        error: 'Unable to load invoices. Please try again.',
      })
    }
  }, [api])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  // Define table columns
  const columns: Column<Invoice>[] = useMemo(
    () => [
      {
        Header: 'Invoice #',
        accessor: 'id',
        Cell: ({ value }: CellProps<Invoice, number>) => (
          <span className="font-monospace">
            {formatInvoiceNumber(String(value))}
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
        Cell: ({ value }: CellProps<Invoice, string | null>) => (
          <>{value ? formatDate(value) : '—'}</>
        ),
        sortType: (rowA: Row<Invoice>, rowB: Row<Invoice>) => {
          const a = rowA.original.date
          const b = rowB.original.date
          if (!a) return 1
          if (!b) return -1
          return new Date(a).getTime() - new Date(b).getTime()
        },
      },
      {
        Header: 'Due Date',
        accessor: 'deadline',
        Cell: ({ value, row }: CellProps<Invoice, string | null>) => {
          const isOverdue =
            !row.original.paid && value && new Date(value) < new Date()

          return (
            <span className={isOverdue ? 'text-danger fw-bold' : ''}>
              {value ? formatDate(value) : '—'}
              {isOverdue && ' ⚠️'}
            </span>
          )
        },
        sortType: (rowA: Row<Invoice>, rowB: Row<Invoice>) => {
          const a = rowA.original.deadline
          const b = rowB.original.deadline
          if (!a) return 1
          if (!b) return -1
          return new Date(a).getTime() - new Date(b).getTime()
        },
      },
      {
        Header: 'Amount',
        accessor: 'total',
        Cell: ({ value }: CellProps<Invoice, string | null>) => {
          const total = value ? parseFloat(value) : 0
          return (
            <span className="text-end font-monospace d-block">
              {formatCurrency(total)}
            </span>
          )
        },
        sortType: (rowA: Row<Invoice>, rowB: Row<Invoice>) => {
          const a = rowA.original.total ? parseFloat(rowA.original.total) : 0
          const b = rowB.original.total ? parseFloat(rowB.original.total) : 0
          return a - b
        },
      },
      {
        Header: 'Status',
        accessor: 'finalized',
        Cell: ({ value, row }: CellProps<Invoice, boolean>) => {
          const paymentStatus = getPaymentStatusLabel(
            row.original.paid,
            row.original.deadline || undefined
          )

          return (
            <>
              <span className={`badge bg-${value ? 'success' : 'secondary'}`}>
                {value ? 'Finalized' : 'Draft'}
              </span>
              {row.original.paid && (
                <span className="badge bg-success ms-1">Paid</span>
              )}
              {!row.original.paid && value && (
                <span className={`badge bg-${paymentStatus.color} ms-1`}>
                  {paymentStatus.label}
                </span>
              )}
            </>
          )
        },
        sortType: (rowA: Row<Invoice>, rowB: Row<Invoice>) => {
          const a = rowA.original.finalized ? 1 : 0
          const b = rowB.original.finalized ? 1 : 0
          return a - b
        },
        id: 'status',
      },
      {
        Header: 'Actions',
        accessor: (row) => row,
        Cell: ({ value: invoice }: CellProps<Invoice, Invoice>) => (
          <div className="btn-group btn-group-sm" role="group">
            {!invoice.finalized && (
              <button className="btn btn-outline-primary" type="button">
                Edit
              </button>
            )}
            {invoice.finalized && (
              <button className="btn btn-outline-secondary" type="button">
                View
              </button>
            )}
            {!invoice.finalized && (
              <button className="btn btn-outline-success" type="button">
                Finalize
              </button>
            )}
            {!invoice.finalized && (
              <button className="btn btn-outline-danger" type="button">
                Delete
              </button>
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
      data: state.invoices,
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
  if (state.loading) {
    return (
      <div className="mt-4">
        <div className="d-flex align-items-center">
          <div
            className="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></div>
          <span>Loading invoices...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (state.error) {
    return (
      <div className="alert alert-danger mt-4" role="alert">
        <h5 className="alert-heading">Error</h5>
        <p>{state.error}</p>
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={fetchInvoices}
        >
          Retry
        </button>
      </div>
    )
  }

  // Empty state
  if (state.invoices.length === 0) {
    return (
      <div className="text-center mt-5 py-5">
        <h4 className="text-muted">No invoices yet</h4>
        <p className="text-muted">Create your first invoice to get started</p>
        <button className="btn btn-primary mt-3">Create Invoice</button>
      </div>
    )
  }

  // Table view with react-table
  return (
    <div className="table-responsive mt-4">
      <table {...getTableProps()} className="table table-hover">
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
      </table>
    </div>
  )
}

export default InvoicesList
