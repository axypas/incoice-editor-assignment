/**
 * InvoicesFilters component
 * Displays filter controls for invoices (status, payment, customer, product, dates)
 */
import React from 'react'
import {
  Form,
  Row as BsRow,
  Col,
  Card,
  ButtonGroup,
  Button,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap'
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

const InvoicesFilters: React.FC<InvoicesFiltersProps> = ({
  filterControl,
  onSubmit,
  onClearFilters,
  currentFilters,
  onStatusChange,
  onPaymentChange,
  hasActiveFilters,
  hasChangedFilters,
  filterSummary,
}) => {
  return (
    <Form onSubmit={onSubmit}>
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
                    onClick={() => onStatusChange(option.value)}
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
                    onClick={() => onPaymentChange(option.value)}
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
              trigger="click"
              overlay={
                hasChangedFilters ? (
                  <div />
                ) : (
                  <Tooltip id="apply-filters-tooltip">
                    Please select at least one filter to apply
                  </Tooltip>
                )
              }
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
              onClick={onClearFilters}
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
  )
}

export default InvoicesFilters
