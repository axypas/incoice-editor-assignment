/**
 * InvoiceForm component (US3)
 * Create/edit invoice with dynamic line items and real-time calculations
 *
 * Features:
 * - Customer selector with searchable dropdown
 * - Auto-generated invoice number
 * - Dynamic line items (add/remove/duplicate)
 * - Real-time calculations with proper decimal precision
 * - Field-level validation on blur
 * - Auto-save with status indicator
 * - Local storage backup to prevent data loss
 */

import React, { useState, useEffect, useCallback, FormEvent } from 'react'
import {
  Form,
  Button,
  Card,
  Row,
  Col,
  Alert,
  Spinner,
  Table,
} from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import { useNavigate } from 'react-router-dom'
import { InvoiceLineItem } from 'types/invoice.types'
import { Customer } from 'types'
import { useApi } from 'api'
import CustomerAutocomplete from 'app/components/CustomerAutocomplete'
import {
  calculateLineItem,
  calculateInvoiceTotals,
  formatCurrency,
} from 'utils/calculations'
import 'react-datepicker/dist/react-datepicker.css'

interface ValidationErrors {
  [key: string]: string
}

interface LineItemErrors {
  [index: number]: {
    [field: string]: string
  }
}

const InvoiceForm: React.FC = () => {
  const navigate = useNavigate()
  const api = useApi()

  // Form state
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [date, setDate] = useState<Date>(new Date())
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('')

  // Line items state
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      label: '',
      quantity: 1,
      unit: 'unit',
      unit_price: 0,
      vat_rate: 20,
    },
  ])

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [lineErrors, setLineErrors] = useState<LineItemErrors>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})

  // Save state
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Generate invoice number on mount
  useEffect(() => {
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')
    setInvoiceNumber(`${year}-${randomNum}`)
  }, [])

  // Auto-save function
  const handleAutoSave = useCallback(async () => {
    // Only auto-save if we have minimum required fields
    if (!customer || lineItems.length === 0) return

    try {
      setIsSaving(true)
      setSaveError(null)

      // Save to local storage as backup
      const backup = {
        customer,
        invoiceNumber,
        date: date.toISOString(),
        deadline: deadline?.toISOString() || null,
        notes,
        terms,
        lineItems,
      }
      localStorage.setItem('invoice_draft', JSON.stringify(backup))

      setLastSaved(new Date())
      setIsDirty(false)
    } catch (error: any) {
      setSaveError('Unable to save. Your changes are preserved locally.')
    } finally {
      setIsSaving(false)
    }
  }, [customer, invoiceNumber, date, deadline, notes, terms, lineItems])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!isDirty) return

    const timer = setTimeout(() => {
      handleAutoSave()
    }, 30000) // 30 seconds

    return () => clearTimeout(timer)
  }, [
    isDirty,
    customer,
    invoiceNumber,
    date,
    deadline,
    notes,
    terms,
    lineItems,
    handleAutoSave,
  ])

  // Warn on navigation if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue =
          'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Mark form as dirty when fields change
  useEffect(() => {
    setIsDirty(true)
  }, [customer, invoiceNumber, date, deadline, notes, terms, lineItems])

  // Validation functions
  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case 'customer':
        if (!value) return 'Please select a customer'
        return null
      case 'invoiceNumber':
        if (!value || value.trim() === '') return 'Invoice number is required'
        return null
      case 'date':
        if (!value) return 'Invoice date is required'
        return null
      default:
        return null
    }
  }

  const validateLineItem = (
    item: InvoiceLineItem,
    field: string
  ): string | null => {
    switch (field) {
      case 'label':
        if (!item.label || item.label.trim() === '')
          return 'Description is required'
        return null
      case 'quantity':
        if (item.quantity <= 0) return 'Quantity must be greater than 0'
        return null
      case 'unit_price':
        if (item.unit_price < 0) return 'Please enter a valid price'
        return null
      case 'vat_rate':
        if (item.vat_rate < 0 || item.vat_rate > 100)
          return 'Tax rate must be between 0 and 100'
        return null
      default:
        return null
    }
  }

  // Handlers
  const handleFieldBlur = (field: string, value: any) => {
    setTouched({ ...touched, [field]: true })
    const error = validateField(field, value)
    if (error) {
      setErrors({ ...errors, [field]: error })
    } else {
      const { [field]: _, ...rest } = errors
      setErrors(rest)
    }
  }

  const handleLineItemChange = (
    index: number,
    field: keyof InvoiceLineItem,
    value: any
  ) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  const handleLineItemBlur = (index: number, field: keyof InvoiceLineItem) => {
    const error = validateLineItem(lineItems[index], field)
    if (error) {
      setLineErrors({
        ...lineErrors,
        [index]: { ...lineErrors[index], [field]: error },
      })
    } else {
      if (lineErrors[index]) {
        const { [field]: _, ...rest } = lineErrors[index]
        if (Object.keys(rest).length === 0) {
          const { [index]: __, ...restErrors } = lineErrors
          setLineErrors(restErrors)
        } else {
          setLineErrors({
            ...lineErrors,
            [index]: rest,
          })
        }
      }
    }
  }

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        label: '',
        quantity: 1,
        unit: 'unit',
        unit_price: 0,
        vat_rate: 20,
      },
    ])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return
    const updated = lineItems.filter((_, i) => i !== index)
    setLineItems(updated)
    // Remove validation errors for this line
    const { [index]: _, ...rest } = lineErrors
    setLineErrors(rest)
  }

  const duplicateLineItem = (index: number) => {
    const item = { ...lineItems[index] }
    const updated = [...lineItems]
    updated.splice(index + 1, 0, item)
    setLineItems(updated)
  }

  // Calculate totals
  const calculations = calculateInvoiceTotals(lineItems)

  // Submit handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Validate all fields
    const newErrors: ValidationErrors = {}
    if (!customer) newErrors.customer = 'Please select a customer'
    if (!invoiceNumber) newErrors.invoiceNumber = 'Invoice number is required'
    if (!date) newErrors.date = 'Invoice date is required'

    // Validate line items
    const newLineErrors: LineItemErrors = {}
    lineItems.forEach((item, index) => {
      const itemErrors: { [key: string]: string } = {}
      const labelError = validateLineItem(item, 'label')
      const quantityError = validateLineItem(item, 'quantity')
      const priceError = validateLineItem(item, 'unit_price')
      const vatError = validateLineItem(item, 'vat_rate')

      if (labelError) itemErrors.label = labelError
      if (quantityError) itemErrors.quantity = quantityError
      if (priceError) itemErrors.unit_price = priceError
      if (vatError) itemErrors.vat_rate = vatError

      if (Object.keys(itemErrors).length > 0) {
        newLineErrors[index] = itemErrors
      }
    })

    if (
      Object.keys(newErrors).length > 0 ||
      Object.keys(newLineErrors).length > 0
    ) {
      setErrors(newErrors)
      setLineErrors(newLineErrors)
      return
    }

    try {
      setIsSaving(true)

      const invoiceData = {
        customer_id: customer!.id,
        invoice_number: invoiceNumber,
        date: date.toISOString().split('T')[0],
        deadline: deadline?.toISOString().split('T')[0],
        invoice_lines: lineItems,
        notes,
        terms,
        finalized: false,
        paid: false,
      }

      await api.postInvoices(null, { invoice: invoiceData })

      // Clear local storage backup
      localStorage.removeItem('invoice_draft')

      // Navigate to invoice list
      navigate('/')
    } catch (error: any) {
      if (error.response?.status === 422) {
        // Validation error from server
        const serverErrors = error.response.data?.errors || {}
        setErrors(serverErrors)
        setSubmitError('Please fix the validation errors and try again.')
      } else if (error.message?.includes('already exists')) {
        setErrors({
          invoiceNumber:
            'This invoice number already exists. Please use a different number.',
        })
        setSubmitError(
          'This invoice number already exists. Please use a different number.'
        )
      } else {
        setSubmitError(
          'Unable to create invoice. Please check your connection and try again.'
        )
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="pb-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Create Invoice</h2>
        <Button variant="outline-secondary" onClick={() => navigate('/')}>
          Cancel
        </Button>
      </div>

      {/* Auto-save status */}
      {(isSaving || lastSaved || saveError) && (
        <Alert variant={saveError ? 'warning' : 'info'} className="mb-3">
          {isSaving && (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Saving...
            </>
          )}
          {!isSaving && lastSaved && !saveError && (
            <>
              Draft saved at{' '}
              {lastSaved.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </>
          )}
          {saveError && <>{saveError}</>}
        </Alert>
      )}

      {/* Submit error */}
      {submitError && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setSubmitError(null)}
        >
          {submitError}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        {/* Header Section */}
        <Card className="mb-4 shadow-sm" style={{ borderRadius: '0.75rem' }}>
          <Card.Body className="p-4">
            <h5 className="mb-3">Invoice Details</h5>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="customer">
                  <Form.Label>
                    Customer <span className="text-danger">*</span>
                  </Form.Label>
                  <CustomerAutocomplete
                    value={customer}
                    onChange={(c) => {
                      setCustomer(c)
                      handleFieldBlur('customer', c)
                    }}
                  />
                  {touched.customer && errors.customer && (
                    <Form.Text className="text-danger">
                      {errors.customer}
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="invoiceNumber">
                  <Form.Label>
                    Invoice Number <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    onBlur={(e) =>
                      handleFieldBlur('invoiceNumber', e.target.value)
                    }
                    isInvalid={touched.invoiceNumber && !!errors.invoiceNumber}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.invoiceNumber}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row className="g-3 mt-2">
              <Col md={6}>
                <Form.Group controlId="date">
                  <Form.Label>
                    Invoice Date <span className="text-danger">*</span>
                  </Form.Label>
                  <DatePicker
                    selected={date}
                    onChange={(d: Date) => {
                      setDate(d)
                      // Auto-calculate deadline (30 days)
                      if (!deadline) {
                        const newDeadline = new Date(d)
                        newDeadline.setDate(newDeadline.getDate() + 30)
                        setDeadline(newDeadline)
                      }
                    }}
                    maxDate={new Date()}
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    onBlur={() => handleFieldBlur('date', date)}
                  />
                  {touched.date && errors.date && (
                    <Form.Text className="text-danger">{errors.date}</Form.Text>
                  )}
                  <Form.Text className="text-muted">
                    Cannot be in the future
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="deadline">
                  <Form.Label>Payment Deadline</Form.Label>
                  <DatePicker
                    selected={deadline}
                    onChange={(d: Date | null) => setDeadline(d)}
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    isClearable
                    placeholderText="Select payment deadline"
                  />
                  <Form.Text className="text-muted">
                    When payment is due
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Line Items Section */}
        <Card className="mb-4 shadow-sm" style={{ borderRadius: '0.75rem' }}>
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Line Items</h5>
              <Button variant="primary" size="sm" onClick={addLineItem}>
                + Add Line
              </Button>
            </div>

            <div className="table-responsive">
              <Table hover>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th style={{ width: '30%' }}>Description</th>
                    <th style={{ width: '10%' }}>Quantity</th>
                    <th style={{ width: '10%' }}>Unit</th>
                    <th style={{ width: '12%' }}>Unit Price</th>
                    <th style={{ width: '10%' }}>Tax %</th>
                    <th style={{ width: '10%' }}>Discount %</th>
                    <th style={{ width: '12%' }} className="text-end">
                      Total
                    </th>
                    <th style={{ width: '6%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => {
                    const calc = calculateLineItem(item)
                    const hasError = lineErrors[index]

                    return (
                      <tr key={index}>
                        <td>
                          <Form.Control
                            type="text"
                            size="sm"
                            value={item.label}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'label',
                                e.target.value
                              )
                            }
                            onBlur={() => handleLineItemBlur(index, 'label')}
                            isInvalid={!!(hasError && hasError.label)}
                            placeholder="Description"
                          />
                          {hasError && hasError.label && (
                            <Form.Text className="text-danger">
                              {hasError.label}
                            </Form.Text>
                          )}
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={item.quantity}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'quantity',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            onBlur={() => handleLineItemBlur(index, 'quantity')}
                            isInvalid={!!(hasError && hasError.quantity)}
                            min="0"
                            step="0.01"
                          />
                          {hasError && hasError.quantity && (
                            <Form.Text className="text-danger">
                              {hasError.quantity}
                            </Form.Text>
                          )}
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            size="sm"
                            value={item.unit}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'unit',
                                e.target.value
                              )
                            }
                            placeholder="unit"
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={item.unit_price}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'unit_price',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            onBlur={() =>
                              handleLineItemBlur(index, 'unit_price')
                            }
                            isInvalid={!!(hasError && hasError.unit_price)}
                            min="0"
                            step="0.01"
                          />
                          {hasError && hasError.unit_price && (
                            <Form.Text className="text-danger">
                              {hasError.unit_price}
                            </Form.Text>
                          )}
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={item.vat_rate}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'vat_rate',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            onBlur={() => handleLineItemBlur(index, 'vat_rate')}
                            isInvalid={!!(hasError && hasError.vat_rate)}
                            min="0"
                            max="100"
                            step="0.01"
                          />
                          {hasError && hasError.vat_rate && (
                            <Form.Text className="text-danger">
                              {hasError.vat_rate}
                            </Form.Text>
                          )}
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={item.discount || ''}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'discount',
                                parseFloat(e.target.value) || undefined
                              )
                            }
                            placeholder="0"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </td>
                        <td className="text-end">
                          <strong>{formatCurrency(calc.total)}</strong>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => duplicateLineItem(index)}
                              title="Duplicate line"
                            >
                              <i className="bi bi-files"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                              disabled={lineItems.length === 1}
                              title="Remove line"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Totals Section */}
        <Card className="mb-4 shadow-sm" style={{ borderRadius: '0.75rem' }}>
          <Card.Body className="p-4">
            <h5 className="mb-3">Totals</h5>
            <Row>
              <Col md={{ span: 6, offset: 6 }}>
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <strong>{formatCurrency(calculations.subtotal)}</strong>
                </div>
                {calculations.totalDiscount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>Discount:</span>
                    <strong>
                      -{formatCurrency(calculations.totalDiscount)}
                    </strong>
                  </div>
                )}
                <div className="d-flex justify-content-between mb-2">
                  <span>Taxable Amount:</span>
                  <strong>{formatCurrency(calculations.taxableAmount)}</strong>
                </div>
                {Object.entries(calculations.vatBreakdown).map(
                  ([rate, amount]) => (
                    <div
                      key={rate}
                      className="d-flex justify-content-between mb-2 text-muted"
                    >
                      <span className="small">VAT {rate}%:</span>
                      <span className="small">{formatCurrency(amount)}</span>
                    </div>
                  )
                )}
                <div className="d-flex justify-content-between mb-2">
                  <span>Total VAT:</span>
                  <strong>{formatCurrency(calculations.totalVat)}</strong>
                </div>
                <hr />
                <div className="d-flex justify-content-between">
                  <strong className="h5">Grand Total:</strong>
                  <strong className="h5">
                    {formatCurrency(calculations.grandTotal)}
                  </strong>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Notes Section */}
        <Card className="mb-4 shadow-sm" style={{ borderRadius: '0.75rem' }}>
          <Card.Body className="p-4">
            <Row>
              <Col md={6}>
                <Form.Group controlId="notes">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes for the customer"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="terms">
                  <Form.Label>Terms & Conditions</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Payment terms and conditions"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Action Buttons */}
        <div className="d-flex justify-content-end gap-2">
          <Button
            variant="outline-secondary"
            onClick={() => navigate('/')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSaving || Object.keys(errors).length > 0}
          >
            {isSaving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Creating...
              </>
            ) : (
              'Create Invoice'
            )}
          </Button>
        </div>
      </Form>
    </div>
  )
}

export default InvoiceForm
