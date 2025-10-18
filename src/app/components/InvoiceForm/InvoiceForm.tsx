/**
 * InvoiceForm component (US3)
 * Rewritten to rely on react-hook-form for field and validation management.
 * Keeps existing UX: on-blur validation, autosave, local-storage draft, and safety guards.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form'
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
import { Customer, Product } from 'types'
import { useApi } from 'api'
import CustomerAutocomplete from 'app/components/CustomerAutocomplete'
import ProductAutocomplete from 'app/components/ProductAutocomplete'
import {
  calculateLineItem,
  calculateInvoiceTotals,
  formatCurrency,
} from 'utils/calculations'
import 'react-datepicker/dist/react-datepicker.css'

const STORAGE_KEY = 'invoice_draft'

interface LineItemFormValue {
  product: Product | null
  product_id?: string
  label: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: string
}

interface InvoiceFormValues {
  customer: Customer | null
  date: Date | null
  deadline: Date | null
  paid: boolean
  lineItems: LineItemFormValue[]
}

interface DraftBackup {
  customer: Customer | null
  date: string | null
  deadline: string | null
  paid: boolean
  lineItems: LineItemFormValue[]
}

const createDefaultLineItem = (): LineItemFormValue => ({
  product: null,
  product_id: undefined,
  label: '',
  quantity: 1,
  unit: 'piece',
  unit_price: 0,
  vat_rate: '0',
})

const createDefaultValues = (): InvoiceFormValues => ({
  customer: null,
  date: new Date(),
  deadline: null,
  paid: false,
  lineItems: [createDefaultLineItem()],
})

const InvoiceForm: React.FC = () => {
  const navigate = useNavigate()
  const api = useApi()

  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const defaultValuesRef = useRef<InvoiceFormValues>(createDefaultValues())
  const skipUnsavedTrackingRef = useRef(true)

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: defaultValuesRef.current,
  })

  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: 'lineItems',
  })

  const watchedValues = useWatch({ control }) as InvoiceFormValues

  const handleAutoSave = useCallback(async (values: InvoiceFormValues) => {
    if (!values.customer || values.lineItems.length === 0) {
      return
    }

    try {
      setIsAutoSaving(true)
      setSaveError(null)

      const snapshot: DraftBackup = {
        customer: values.customer,
        date: values.date ? values.date.toISOString() : null,
        deadline: values.deadline ? values.deadline.toISOString() : null,
        paid: values.paid,
        lineItems: values.lineItems.map((item) => ({
          ...item,
          product: item.product ? { ...item.product } : null,
        })),
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      setSaveError('Unable to save. Your changes are preserved locally.')
      console.error('Invoice autosave failed:', error)
    } finally {
      setIsAutoSaving(false)
    }
  }, [])

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        skipUnsavedTrackingRef.current = true
        return
      }

      const parsed = JSON.parse(saved) as DraftBackup
      const restored: InvoiceFormValues = {
        customer: parsed.customer ?? null,
        date: parsed.date ? new Date(parsed.date) : null,
        deadline: parsed.deadline ? new Date(parsed.deadline) : null,
        paid: parsed.paid ?? false,
        lineItems:
          parsed.lineItems && parsed.lineItems.length > 0
            ? parsed.lineItems.map((item) => ({
                ...item,
                product: item.product ? { ...item.product } : null,
              }))
            : [createDefaultLineItem()],
      }

      defaultValuesRef.current = restored
      reset(restored)
      setHasUnsavedChanges(false)
      setLastSaved(null)
      setSaveError(null)
    } catch (error) {
      skipUnsavedTrackingRef.current = true
      console.error('Failed to restore draft:', error)
    }
  }, [reset])

  // Track dirty state manually so autosave and navigation guard stay in sync
  useEffect(() => {
    if (skipUnsavedTrackingRef.current) {
      skipUnsavedTrackingRef.current = false
      return
    }
    setHasUnsavedChanges(true)
  }, [watchedValues])

  // Auto-save on form changes with 30s debounce
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const timer = setTimeout(() => {
      handleAutoSave(watchedValues)
    }, 30000)

    return () => clearTimeout(timer)
  }, [hasUnsavedChanges, watchedValues, handleAutoSave])

  // Warn on navigation if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault()
        event.returnValue =
          'You have unsaved changes. Are you sure you want to leave?'
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const resetForm = useCallback(() => {
    const defaults = createDefaultValues()
    defaultValuesRef.current = defaults
    skipUnsavedTrackingRef.current = true
    reset(defaults)
    setHasUnsavedChanges(false)
    setLastSaved(null)
    setSaveError(null)
    setSubmitError(null)
  }, [reset])

  const handleCancel = useCallback(() => {
    const current = getValues()
    const hasData =
      hasUnsavedChanges ||
      current.customer !== null ||
      current.lineItems.some((item) => item.product_id !== undefined)

    if (hasData) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      )
      if (!confirmed) {
        return
      }
      localStorage.removeItem(STORAGE_KEY)
    }

    navigate('/')
  }, [getValues, hasUnsavedChanges, navigate])

  const handleProductSelect = useCallback(
    (index: number, product: Product | null) => {
      const base = createDefaultLineItem()

      if (product) {
        setValue(`lineItems.${index}.product`, product, {
          shouldDirty: true,
          shouldTouch: true,
        })
        setValue(`lineItems.${index}.product_id`, String(product.id), {
          shouldDirty: true,
        })
        setValue(`lineItems.${index}.label`, product.label ?? base.label, {
          shouldDirty: true,
        })
        setValue(`lineItems.${index}.unit`, product.unit ?? base.unit, {
          shouldDirty: true,
        })
        setValue(
          `lineItems.${index}.vat_rate`,
          product.vat_rate ?? base.vat_rate,
          { shouldDirty: true }
        )
        const unitPrice = parseFloat(product.unit_price_without_tax) || 0
        setValue(`lineItems.${index}.unit_price`, unitPrice, {
          shouldDirty: true,
        })
        clearErrors([
          `lineItems.${index}.product`,
          `lineItems.${index}.product_id`,
        ])
      } else {
        setValue(`lineItems.${index}.product`, null, {
          shouldDirty: true,
          shouldTouch: true,
        })
        setValue(`lineItems.${index}.product_id`, base.product_id, {
          shouldDirty: true,
        })
        setValue(`lineItems.${index}.label`, base.label, {
          shouldDirty: true,
        })
        setValue(`lineItems.${index}.unit`, base.unit, { shouldDirty: true })
        setValue(`lineItems.${index}.vat_rate`, base.vat_rate, {
          shouldDirty: true,
        })
        setValue(`lineItems.${index}.unit_price`, base.unit_price, {
          shouldDirty: true,
        })
      }
    },
    [setValue, clearErrors]
  )

  const addLineItem = useCallback(() => {
    append(createDefaultLineItem())
  }, [append])

  const removeLineItem = useCallback(
    (index: number) => {
      if (fields.length === 1) return
      remove(index)
    },
    [fields.length, remove]
  )

  const duplicateLineItem = useCallback(
    (index: number) => {
      const source = getValues(`lineItems.${index}`)
      if (!source) return

      insert(index + 1, {
        ...source,
        product: source.product ? { ...source.product } : null,
      })
    },
    [getValues, insert]
  )

  const onSubmit = useCallback(
    async (values: InvoiceFormValues) => {
      setSubmitError(null)

      try {
        const invoice_lines_attributes = values.lineItems.map((item, idx) => {
          if (!item.product_id) {
            throw new Error(`Missing product for line item ${idx + 1}`)
          }
          return {
            product_id: parseInt(item.product_id, 10),
            quantity: item.quantity,
          }
        })

        if (!values.customer) {
          setError('customer', {
            type: 'manual',
            message: 'Please select a customer',
          })
          return
        }

        if (!values.date) {
          setError('date', {
            type: 'manual',
            message: 'Invoice date is required',
          })
          return
        }

        const invoiceData = {
          customer_id: values.customer.id,
          date: values.date.toISOString().split('T')[0],
          deadline: values.deadline
            ? values.deadline.toISOString().split('T')[0]
            : null,
          invoice_lines_attributes,
          finalized: false,
          paid: values.paid,
        }

        await api.postInvoices(null, { invoice: invoiceData })
        localStorage.removeItem(STORAGE_KEY)
        resetForm()
        navigate('/')
      } catch (error: any) {
        if (error.response?.status === 422) {
          const serverErrors: Record<string, unknown> =
            error.response.data?.errors || {}
          Object.entries(serverErrors).forEach(([field, message]) => {
            const rawMessage = Array.isArray(message)
              ? message
                  .filter((entry): entry is string => typeof entry === 'string')
                  .join(', ')
              : message
            const errorMessage =
              typeof rawMessage === 'string' && rawMessage.trim().length > 0
                ? rawMessage
                : 'Unexpected validation error'

            if (field === 'customer') {
              setError('customer', { type: 'server', message: errorMessage })
            } else if (field === 'date') {
              setError('date', { type: 'server', message: errorMessage })
            } else if (field === 'deadline') {
              setError('deadline', { type: 'server', message: errorMessage })
            } else if (field.startsWith('lineItems')) {
              const [, indexStr, key] = field.split('.')
              const lineIndex = Number(indexStr)
              if (!Number.isNaN(lineIndex)) {
                setError(
                  `lineItems.${lineIndex}.${key}` as any,
                  {
                    type: 'server',
                    message: errorMessage,
                  },
                  { shouldFocus: false }
                )
              }
            }
          })

          setSubmitError('Please fix the validation errors and try again.')
        } else {
          setSubmitError(
            'Unable to create invoice. Please check your connection and try again.'
          )
        }
        console.error('Invoice creation error:', error)
      }
    },
    [api, resetForm, setError, navigate]
  )

  const { totals, perLine, lineItems } = useMemo(() => {
    const items = watchedValues?.lineItems ?? []
    const invoiceLineItems: InvoiceLineItem[] = items.map((item) => ({
      product: item.product,
      product_id: item.product_id,
      label: item.label,
      quantity: item.quantity ?? 0,
      unit: item.unit,
      unit_price: item.unit_price ?? 0,
      vat_rate: item.vat_rate,
    }))

    return {
      totals: calculateInvoiceTotals(invoiceLineItems),
      perLine: invoiceLineItems.map((invoiceItem) =>
        calculateLineItem(invoiceItem)
      ),
      lineItems: items,
    }
  }, [watchedValues?.lineItems])

  const hasValidationErrors =
    !!errors.customer ||
    !!errors.date ||
    !!errors.deadline ||
    !!errors.lineItems

  return (
    <div className="pb-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Create Invoice</h2>
      </div>

      {(isAutoSaving || lastSaved || saveError) && (
        <Alert variant={saveError ? 'warning' : 'info'} className="mb-3">
          {isAutoSaving && (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Saving draft...
            </>
          )}
          {!isAutoSaving && lastSaved && !saveError && (
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

      {submitError && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setSubmitError(null)}
        >
          {submitError}
        </Alert>
      )}

      <Form onSubmit={handleSubmit(onSubmit)}>
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
                  <Form.Text className="text-muted">
                    When payment is due
                  </Form.Text>
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
                  {fields.map((field, index) => {
                    const item = lineItems[index] ?? createDefaultLineItem()
                    const calculation = perLine[index]

                    return (
                      <tr key={field.id} className="align-middle">
                        <td>
                          <Controller
                            name={`lineItems.${index}.product`}
                            control={control}
                            rules={{
                              validate: (value) =>
                                value ? true : 'Please select a product',
                            }}
                            render={({ field: productField, fieldState }) => (
                              <>
                                <ProductAutocomplete
                                  value={productField.value}
                                  onChange={(product) => {
                                    productField.onChange(product)
                                    handleProductSelect(index, product)
                                  }}
                                  onBlur={productField.onBlur}
                                />
                                {fieldState.error && (
                                  <Form.Text className="text-danger">
                                    {fieldState.error.message}
                                  </Form.Text>
                                )}
                              </>
                            )}
                          />
                        </td>
                        <td>
                          <Controller
                            name={`lineItems.${index}.quantity`}
                            control={control}
                            rules={{
                              required: 'Quantity must be greater than 0',
                              validate: (value) =>
                                value > 0 || 'Quantity must be greater than 0',
                            }}
                            render={({ field: quantityField, fieldState }) => (
                              <>
                                <Form.Control
                                  type="number"
                                  size="sm"
                                  min="0"
                                  step="1"
                                  disabled={!item.product_id}
                                  value={
                                    Number.isFinite(quantityField.value)
                                      ? quantityField.value
                                      : ''
                                  }
                                  onChange={(event) => {
                                    const nextValue = Number(event.target.value)
                                    quantityField.onChange(
                                      Number.isNaN(nextValue) ? 0 : nextValue
                                    )
                                  }}
                                  onBlur={quantityField.onBlur}
                                />
                                {fieldState.error && (
                                  <Form.Text className="text-danger">
                                    {fieldState.error.message}
                                  </Form.Text>
                                )}
                              </>
                            )}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            size="sm"
                            value={item.unit}
                            readOnly
                            disabled
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={item.unit_price}
                            readOnly
                            disabled
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            size="sm"
                            value={item.vat_rate}
                            readOnly
                            disabled
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
                          <strong>
                            {formatCurrency(calculation?.total ?? 0)}
                          </strong>
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
                              disabled={fields.length === 1}
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

        <Card className="mb-4 shadow-sm" style={{ borderRadius: '0.75rem' }}>
          <Card.Body className="p-4">
            <h5 className="mb-3">Totals</h5>
            <Row>
              <Col md={{ span: 6, offset: 6 }}>
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <strong>{formatCurrency(totals.subtotal)}</strong>
                </div>
                {totals.totalDiscount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>Discount:</span>
                    <strong>-{formatCurrency(totals.totalDiscount)}</strong>
                  </div>
                )}
                <div className="d-flex justify-content-between mb-2">
                  <span>Taxable Amount:</span>
                  <strong>{formatCurrency(totals.taxableAmount)}</strong>
                </div>
                {Object.entries(totals.vatBreakdown).map(([rate, amount]) => (
                  <div
                    key={rate}
                    className="d-flex justify-content-between mb-2 text-muted"
                  >
                    <span className="small">VAT {rate}%:</span>
                    <span className="small">{formatCurrency(amount)}</span>
                  </div>
                ))}
                <div className="d-flex justify-content-between mb-2">
                  <span>Total VAT:</span>
                  <strong>{formatCurrency(totals.totalVat)}</strong>
                </div>
                <hr />
                <div className="d-flex justify-content-between">
                  <strong className="h5">Grand Total:</strong>
                  <strong className="h5">
                    {formatCurrency(totals.grandTotal)}
                  </strong>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-end gap-2">
          <Button
            variant="outline-secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || hasValidationErrors}
          >
            {isSubmitting ? (
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
