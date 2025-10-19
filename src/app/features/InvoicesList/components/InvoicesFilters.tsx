/**
 * InvoicesFilters component
 * Displays filter controls for invoices (status, payment, customer, product, dates)
 */
import React from 'react'
import { Form, Card, ButtonGroup, Button } from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Control, Controller } from 'react-hook-form'
import CustomerAutocomplete from 'common/components/CustomerAutocomplete'
import ProductAutocomplete from 'common/components/ProductAutocomplete'
import type {
  StatusFilter,
  PaymentFilter,
  FilterFormData,
} from 'app/features/InvoicesList/hooks/useInvoiceFilters'

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

interface InvoicesFiltersProps {
  filterControl: Control<FilterFormData>
  onSubmit: (e?: React.BaseSyntheticEvent) => void
  onClearFilters: () => void
  currentFilters: FilterFormData
  onStatusChange: (value: StatusFilter) => void
  onPaymentChange: (value: PaymentFilter) => void
  hasActiveFilters: boolean
  hasChangedFilters: boolean
  filterSummary: string
}

const InvoicesFilters = ({
  filterControl,
  onSubmit,
  onClearFilters,
  currentFilters,
  onStatusChange,
  onPaymentChange,
  hasActiveFilters,
  hasChangedFilters,
  filterSummary,
}: InvoicesFiltersProps): JSX.Element => {
  return (
    <Form onSubmit={onSubmit}>
      <Card className="p-4 shadow-sm rounded-xl">
        {/* Filter Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <Form.Group controlId="status">
            <Form.Label className="text-uppercase small fw-semibold text-muted text-xs tracking-wide">
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
                  onClick={() => onStatusChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </ButtonGroup>
          </Form.Group>

          <Form.Group controlId="payment">
            <Form.Label className="text-uppercase small fw-semibold text-muted text-xs tracking-wide">
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
                  onClick={() => onPaymentChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </ButtonGroup>
          </Form.Group>

          <Form.Group controlId="customer">
            <Form.Label className="text-uppercase small fw-semibold text-muted text-xs tracking-wide">
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

          <Form.Group controlId="product">
            <Form.Label className="text-uppercase small fw-semibold text-muted text-xs tracking-wide">
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

          <Form.Group controlId="dateRange" className="flex flex-col">
            <Form.Label className="text-uppercase small fw-semibold text-muted text-xs tracking-wide">
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

          <Form.Group controlId="dueDateRange" className="flex flex-col">
            <Form.Label className="text-uppercase small fw-semibold text-muted text-xs tracking-wide">
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
        </div>

        {/* Buttons */}
        <div className="mt-3">
          <div className="d-flex gap-2">
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
              onClick={onClearFilters}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3">
            <small className="text-muted">
              <strong>Active filters:</strong> {filterSummary}
            </small>
          </div>
        )}
      </Card>
    </Form>
  )
}

export default InvoicesFilters
