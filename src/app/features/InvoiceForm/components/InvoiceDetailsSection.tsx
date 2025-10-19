/**
 * InvoiceDetailsSection component
 * Displays customer, date, deadline, and paid status fields
 */

import React from 'react'
import { Form, Card, Row, Col } from 'react-bootstrap'
import {
  Controller,
  Control,
  UseFormGetValues,
  UseFormSetValue,
} from 'react-hook-form'
import DatePicker from 'react-datepicker'
import { CustomerAutocomplete } from 'common/components'
import type { Customer } from 'common/types'
import 'react-datepicker/dist/react-datepicker.css'

interface InvoiceFormValues {
  customer: Customer | null
  date: Date | null
  deadline: Date | null
  paid: boolean
  lineItems: any[]
}

interface InvoiceDetailsSectionProps {
  control: Control<InvoiceFormValues>
  getValues: UseFormGetValues<InvoiceFormValues>
  setValue: UseFormSetValue<InvoiceFormValues>
}

const InvoiceDetailsSection: React.FC<InvoiceDetailsSectionProps> = ({
  control,
  getValues,
  setValue,
}) => {
  return (
    <Card className="mb-4 shadow-sm" style={{ borderRadius: '0.75rem' }}>
      <Card.Body className="p-4">
        <h5 className="mb-3">Invoice Details</h5>

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
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const normalizedValue = new Date(value)
                    normalizedValue.setHours(0, 0, 0, 0)
                    if (normalizedValue > today) {
                      return 'Invoice date cannot be in the future'
                    }
                    return true
                  },
                }}
                render={({ field, fieldState }) => (
                  <>
                    <DatePicker
                      selected={field.value}
                      isClearable
                      onChange={(selected: Date | null) => {
                        field.onChange(selected)
                        const currentDeadline = getValues('deadline')
                        if (selected && !currentDeadline) {
                          const autoDeadline = new Date(selected)
                          autoDeadline.setDate(autoDeadline.getDate() + 30)
                          setValue('deadline', autoDeadline, {
                            shouldDirty: true,
                          })
                        }
                      }}
                      maxDate={new Date()}
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
                Cannot be in the future
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
                    if (invoiceDate && value < invoiceDate) {
                      return 'Payment deadline must be after invoice date'
                    }
                    return true
                  },
                }}
                render={({ field, fieldState }) => (
                  <>
                    <DatePicker
                      selected={field.value}
                      onChange={(selected: Date | null) => {
                        field.onChange(selected)
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
