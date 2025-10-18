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
 * - Auto-save on form changes (debounced 500ms)
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
import ProductAutocomplete from 'app/components/ProductAutocomplete'
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
  const [date, setDate] = useState<Date | null>(new Date())
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [paid, setPaid] = useState(false)

  // Line items state - each line needs a product
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      product: null,
      product_id: undefined,
      label: '',
      quantity: 1,
      unit: '-',
      unit_price: 0,
      vat_rate: '-',
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
        date: date?.toISOString() || null,
        deadline: deadline?.toISOString() || null,
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
  }, [customer, date, deadline, lineItems])

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('invoice_draft')
      if (saved) {
        const backup = JSON.parse(saved)
        setCustomer(backup.customer)
        setDate(backup.date ? new Date(backup.date) : null)
        setDeadline(backup.deadline ? new Date(backup.deadline) : null)
        setLineItems(backup.lineItems)
        setIsDirty(false) // Don't mark as dirty on restore
      }
    } catch (error) {
      console.error('Failed to restore draft:', error)
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save on form changes
  useEffect(() => {
    if (!isDirty) return

    // Debounce to avoid too many saves while typing
    const timer = setTimeout(() => {
      handleAutoSave()
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [customer, date, deadline, lineItems, isDirty, handleAutoSave])

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
  }, [customer, date, deadline, paid, lineItems])

  // Validation functions
  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case 'customer':
        if (!value) return 'Please select a customer'
        return null
      case 'date':
        if (!value) return 'Invoice date is required'
        // Check if date is in the future
        if (value && new Date(value) > new Date()) {
          return 'Invoice date cannot be in the future'
        }
        return null
      case 'deadline':
        // Optional field, but if provided should be after invoice date
        if (value && date && new Date(value) < new Date(date)) {
          return 'Payment deadline must be after invoice date'
        }
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
      case 'product':
      case 'product_id':
        if (!item.product_id) return 'Please select a product'
        return null
      case 'quantity':
        if (item.quantity <= 0) return 'Quantity must be greater than 0'
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

  const handleProductSelect = (index: number, product: any | null) => {
    const updated = [...lineItems]
    if (product) {
      // Auto-populate fields from product
      updated[index] = {
        ...updated[index],
        product,
        product_id: String(product.id),
        label: product.label,
        unit: product.unit, // Keep as string from API
        vat_rate: product.vat_rate, // Keep as string from API (enum: "0", "5.5", "10", "20")
        unit_price: parseFloat(product.unit_price_without_tax) || 0,
      }
      // Clear the error for this field since we now have a product
      if (lineErrors[index]?.product_id) {
        const { product_id: _, ...restErrors } = lineErrors[index]
        if (Object.keys(restErrors).length === 0) {
          const { [index]: __, ...restLineErrors } = lineErrors
          setLineErrors(restLineErrors)
        } else {
          setLineErrors({
            ...lineErrors,
            [index]: restErrors,
          })
        }
      }
    } else {
      // Clear product fields
      updated[index] = {
        ...updated[index],
        product: null,
        product_id: undefined,
        label: '',
        unit: 'piece',
        vat_rate: '20', // String enum value
        unit_price: 0,
      }
      // Set error since product is now cleared
      setLineErrors({
        ...lineErrors,
        [index]: {
          ...lineErrors[index],
          product_id: 'Please select a product',
        },
      })
    }
    setLineItems(updated)
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
        product: null,
        product_id: undefined,
        label: '',
        quantity: 1,
        unit: 'piece',
        unit_price: 0,
        vat_rate: '20', // String enum value
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

  // Reset form to initial state
  const resetForm = () => {
    setCustomer(null)
    setDate(null)
    setDeadline(null)
    setPaid(false)
    setLineItems([
      {
        product: null,
        product_id: undefined,
        label: '',
        quantity: 1,
        unit: 'piece',
        unit_price: 0,
        vat_rate: '20',
      },
    ])
    setErrors({})
    setLineErrors({})
    setTouched({})
    setLastSaved(null)
    setIsDirty(false)
    setSubmitError(null)
  }

  // Handle cancel with confirmation if form has data
  const handleCancel = () => {
    // Check if form has any data
    const hasData =
      customer !== null ||
      lineItems.some((item) => item.product_id !== undefined)

    if (hasData) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      )
      if (confirmed) {
        // Clear draft and navigate away
        localStorage.removeItem('invoice_draft')
        navigate('/')
      }
    } else {
      // No data, just navigate away
      navigate('/')
    }
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
    if (!date) newErrors.date = 'Invoice date is required'

    // Validate line items
    const newLineErrors: LineItemErrors = {}
    lineItems.forEach((item, index) => {
      const itemErrors: { [key: string]: string } = {}
      const productError = validateLineItem(item, 'product_id')
      const quantityError = validateLineItem(item, 'quantity')
      const priceError = validateLineItem(item, 'unit_price')
      const vatError = validateLineItem(item, 'vat_rate')

      if (productError) itemErrors.product_id = productError
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

      // Prepare line items for API - only product_id and quantity
      const invoice_lines_attributes = lineItems.map((item) => ({
        product_id: parseInt(item.product_id!, 10),
        quantity: item.quantity,
      }))

      const invoiceData = {
        customer_id: customer!.id,
        date: date!.toISOString().split('T')[0],
        deadline: deadline?.toISOString().split('T')[0] || null,
        invoice_lines_attributes,
        finalized: false,
        paid,
      }

      await api.postInvoices(null, { invoice: invoiceData })

      // Clear local storage backup
      localStorage.removeItem('invoice_draft')

      // Reset form to create another invoice
      resetForm()
    } catch (error: any) {
      if (error.response?.status === 422) {
        // Validation error from server
        const serverErrors = error.response.data?.errors || {}
        setErrors(serverErrors)
        setSubmitError('Please fix the validation errors and try again.')
      } else {
        setSubmitError(
          'Unable to create invoice. Please check your connection and try again.'
        )
      }
      console.error('Invoice creation error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="pb-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Create Invoice</h2>
        <Button variant="outline-secondary" onClick={handleCancel}>
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
              <Col md={12}>
                <Form.Group controlId="customer" className="flex flex-col">
                  <Form.Label>
                    Customer <span className="text-danger">*</span>
                  </Form.Label>
                  <CustomerAutocomplete
                    value={customer}
                    onChange={(c) => {
                      setCustomer(c)
                    }}
                    onBlur={() => handleFieldBlur('customer', customer)}
                  />
                  {touched.customer && errors.customer && (
                    <Form.Text className="text-danger">
                      {errors.customer}
                    </Form.Text>
                  )}
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
                  <DatePicker
                    selected={date}
                    isClearable
                    onChange={(d: Date | null) => {
                      setDate(d)
                      // Auto-calculate deadline (30 days)
                      if (d && !deadline) {
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
                <Form.Group controlId="deadline" className="flex flex-col">
                  <Form.Label>Payment Deadline</Form.Label>
                  <DatePicker
                    selected={deadline}
                    onChange={(d: Date | null) => {
                      setDeadline(d)
                      handleFieldBlur('deadline', d)
                    }}
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    isClearable
                    placeholderText="Select payment deadline"
                    onBlur={() => handleFieldBlur('deadline', deadline)}
                  />
                  {touched.deadline && errors.deadline && (
                    <Form.Text className="text-danger">
                      {errors.deadline}
                    </Form.Text>
                  )}
                  <Form.Text className="text-muted">
                    When payment is due
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Row className="g-3 mt-2">
              <Col md={12}>
                <Form.Check
                  type="checkbox"
                  id="paid"
                  label="Mark as paid"
                  checked={paid}
                  onChange={(e) => setPaid(e.target.checked)}
                />
                <Form.Text className="text-muted">
                  Check this if the invoice has already been paid
                </Form.Text>
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
                    <th style={{ width: '26%' }}>Product</th>
                    <th style={{ width: '10%' }}>Qty</th>
                    <th style={{ width: '10%' }}>Unit</th>
                    <th style={{ width: '12%' }}>Price</th>
                    <th style={{ width: '10%' }}>Tax %</th>
                    <th style={{ width: '12%' }} className="text-end">
                      Tax Amount
                    </th>
                    <th style={{ width: '12%' }} className="text-end">
                      Total
                    </th>
                    <th style={{ width: '8%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => {
                    const calc = calculateLineItem(item)
                    const hasError = lineErrors[index]

                    return (
                      <tr key={index} className="align-middle">
                        <td>
                          <ProductAutocomplete
                            value={item.product || null}
                            onChange={(product) =>
                              handleProductSelect(index, product)
                            }
                            onBlur={() =>
                              handleLineItemBlur(index, 'product_id')
                            }
                          />
                          {hasError && hasError.product_id && (
                            <Form.Text className="text-danger">
                              {hasError.product_id}
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
                            step="1"
                            disabled={!item.product_id}
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
                            disabled={true}
                            readOnly
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={item.unit_price}
                            disabled={true}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            size="sm"
                            value={item.vat_rate}
                            disabled={true}
                          />
                        </td>
                        <td className="text-end">
                          <strong>
                            {formatCurrency(
                              item.product?.unit_tax
                                ? item.quantity *
                                    parseFloat(item.product.unit_tax)
                                : 0
                            )}
                          </strong>
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
                              title="Duplicate this line"
                            >
                              Copy
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                              disabled={lineItems.length === 1}
                              title="Remove this line"
                            >
                              Remove
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

        {/* Action Buttons */}
        <div className="d-flex justify-content-end gap-2">
          <Button
            variant="outline-secondary"
            onClick={handleCancel}
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
