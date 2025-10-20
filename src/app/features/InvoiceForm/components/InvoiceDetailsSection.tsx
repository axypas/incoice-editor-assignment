/**
 * InvoiceDetailsSection component
 * Displays customer, date, deadline, and paid status fields
 */

import { Form, Card, Row, Col } from 'react-bootstrap'
import { Controller, useFormContext } from 'react-hook-form'
import DatePicker from 'react-datepicker'
import { CustomerAutocomplete } from 'common/components'
import type { Customer, Product } from 'common/types'
import 'react-datepicker/dist/react-datepicker.css'

interface LineItemFormValue {
  id?: string
  product: Product | null
  product_id?: string
  label: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: string
  _destroy?: boolean
}

interface InvoiceFormValues {
  customer: Customer | null
  date: Date | null
  deadline: Date | null
  paid: boolean
  finalized: boolean
  lineItems: LineItemFormValue[]
}

const InvoiceDetailsSection = (): JSX.Element => {
  const { control, getValues, setValue, trigger } =
    useFormContext<InvoiceFormValues>()
  return (
    <Card className="mb-4 shadow-sm rounded-xl">
      <Card.Body className="p-4">
        <h3 className="mb-3 h5">Invoice Details</h3>

        <Row className="g-3">
          <Col md={12}>
            <Form.Group controlId="customer" className="flex flex-col">
              <Form.Label>
                Customer <span className="text-danger">*</span>
              </Form.Label>
              <Controller
                name="customer"
                control={control}
                rules={{
                  validate: (value) =>
                    value ? true : 'Please select a customer',
                }}
                render={({ field, fieldState }) => (
                  <>
                    <CustomerAutocomplete
                      inputId="customer"
                      value={field.value}
                      onChange={(customer) => field.onChange(customer)}
                      onBlur={field.onBlur}
                    />
                    {fieldState.error && (
                      <Form.Text className="text-danger">
                        {fieldState.error.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
              <Form.Text className="text-muted">
                Invoice number will be generated automatically
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <Row className="g-3 mt-2">
          <Col md={6}>
            <Form.Group controlId="date" className="flex flex-col">
              <Form.Label>
                Invoice Date <span className="text-danger">*</span>
              </Form.Label>
              <Controller
                name="date"
                control={control}
                rules={{
                  validate: (value) => {
                    if (!value) return 'Invoice date is required'
                    return true
                  },
                }}
                render={({ field, fieldState }) => (
                  <>
                    <DatePicker
                      id="date"
                      selected={field.value}
                      isClearable
                      onChange={async (selected: Date | null) => {
                        field.onChange(selected)
                        const currentDeadline = getValues('deadline')
                        if (selected && !currentDeadline) {
                          const autoDeadline = new Date(selected)
                          autoDeadline.setDate(autoDeadline.getDate() + 30)
                          setValue('deadline', autoDeadline, {
                            shouldDirty: true,
                          })
                        }
                        // Trigger validation immediately
                        if (trigger) {
                          await trigger('date')
                          // Re-validate deadline when invoice date changes
                          if (currentDeadline) {
                            await trigger('deadline')
                          }
                        }
                      }}
                      dateFormat="yyyy-MM-dd"
                      className="form-control"
                      onBlur={field.onBlur}
                    />
                    {fieldState.error && (
                      <Form.Text className="text-danger">
                        {fieldState.error.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
              <Form.Text className="text-muted">
                Date when the invoice was or will be issued
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="deadline" className="flex flex-col">
              <Form.Label>Payment Deadline</Form.Label>
              <Controller
                name="deadline"
                control={control}
                rules={{
                  validate: (value) => {
                    if (!value) return true

                    const invoiceDate = getValues('date')
                    if (!invoiceDate) return true

                    // Normalize both dates to midnight for fair comparison
                    const normalizedDeadline = new Date(value)
                    normalizedDeadline.setHours(0, 0, 0, 0)
                    const normalizedInvoiceDate = new Date(invoiceDate)
                    normalizedInvoiceDate.setHours(0, 0, 0, 0)

                    // Payment deadline cannot be before invoice date
                    if (normalizedDeadline < normalizedInvoiceDate) {
                      return 'Payment deadline cannot be before invoice date'
                    }

                    return true
                  },
                }}
                render={({ field, fieldState }) => (
                  <>
                    <DatePicker
                      id="deadline"
                      selected={field.value}
                      onChange={async (selected: Date | null) => {
                        field.onChange(selected)
                        // Trigger validation immediately after value update
                        if (trigger) {
                          await trigger('deadline')
                        }
                      }}
                      dateFormat="yyyy-MM-dd"
                      className="form-control"
                      isClearable
                      placeholderText="Select payment deadline"
                      onBlur={field.onBlur}
                    />
                    {fieldState.error && (
                      <Form.Text className="text-danger">
                        {fieldState.error.message}
                      </Form.Text>
                    )}
                  </>
                )}
              />
              <Form.Text className="text-muted">When payment is due</Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <Row className="g-3 mt-2">
          <Col md={12}>
            <Controller
              name="paid"
              control={control}
              render={({ field }) => (
                <Form.Check
                  type="checkbox"
                  id="paid"
                  label="Mark as paid"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
              )}
            />
            <Form.Text className="text-muted">
              Check this if the invoice has already been paid
            </Form.Text>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}

export default InvoiceDetailsSection
