/**
 * InvoiceForm component (US3, US4)
 * Supports both create and edit modes
 * Rewritten to rely on react-hook-form for field and validation management.
 * Keeps existing UX: on-blur validation, autosave, local-storage draft, and safety guards.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { Form } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import { InvoiceLineItem } from 'common/types/invoice.types'
import { Customer, Product } from 'common/types'
import { useApi } from 'api'
import {
  calculateLineItem,
  calculateInvoiceTotals,
} from 'common/utils/calculations'
import {
  useInvoice,
  useUpdateInvoice,
} from 'app/features/InvoicesList/hooks/useInvoices'
import {
  FinalizedInvoiceAlert,
  FormHeader,
  InvoiceDetailsSection,
  LineItemsSection,
  TotalsSection,
  FormActions,
} from './components'
import ErrorState from 'app/features/InvoiceShow/components/ErrorState'
import 'react-datepicker/dist/react-datepicker.css'

const STORAGE_KEY = 'invoice_draft'
const getEditStorageKey = (id: string) => `draft-invoice-${id}`

interface LineItemFormValue {
  id?: string // For existing line items in edit mode
  product: Product | null
  product_id?: string
  label: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: string
  _destroy?: boolean // For marking items for deletion
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
  const { id: invoiceId } = useParams<{ id: string }>()
  const isEditMode = !!invoiceId

  // Fetch invoice data if in edit mode
  const {
    invoice: existingInvoice,
    isLoading: isLoadingInvoice,
    isError: isInvoiceError,
    error: invoiceError,
  } = useInvoice(invoiceId || '')

  const { updateInvoice, isUpdating } = useUpdateInvoice()

  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isFormInitialized, setIsFormInitialized] = useState(false)

  const defaultValuesRef = useRef<InvoiceFormValues>(createDefaultValues())
  const skipUnsavedTrackingRef = useRef(true)
  const storageKey =
    isEditMode && invoiceId ? getEditStorageKey(invoiceId) : STORAGE_KEY

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

  const handleAutoSave = useCallback(
    async (values: InvoiceFormValues) => {
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

        localStorage.setItem(storageKey, JSON.stringify(snapshot))
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
      } catch (error) {
        setSaveError('Unable to save. Your changes are preserved locally.')
        console.error('Invoice autosave failed:', error)
      } finally {
        setIsAutoSaving(false)
      }
    },
    [storageKey]
  )

  // Pre-populate form from existing invoice in edit mode
  useEffect(() => {
    if (!isEditMode || !existingInvoice || isFormInitialized) return

    try {
      // Check localStorage for draft first (unsaved changes)
      const saved = localStorage.getItem(storageKey)
      if (saved) {
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
        setIsFormInitialized(true)
        return
      }

      // Otherwise populate from existing invoice
      // Convert customer from domain type (id: string) to API type (id: number)
      const customerForForm = existingInvoice.customer
        ? ({
            ...existingInvoice.customer,
            id: parseInt(existingInvoice.customer.id, 10),
          } as Customer)
        : null

      const formValues: InvoiceFormValues = {
        customer: customerForForm,
        date: existingInvoice.date ? new Date(existingInvoice.date) : null,
        deadline: existingInvoice.deadline
          ? new Date(existingInvoice.deadline)
          : null,
        paid: existingInvoice.paid || false,
        lineItems:
          existingInvoice.invoice_lines &&
          existingInvoice.invoice_lines.length > 0
            ? existingInvoice.invoice_lines.map((line) => ({
                id: line.id,
                product: line.product || null,
                product_id: line.product_id,
                label: line.label,
                quantity: line.quantity,
                unit: line.unit,
                unit_price: line.unit_price,
                vat_rate: String(line.vat_rate),
              }))
            : [createDefaultLineItem()],
      }

      defaultValuesRef.current = formValues
      skipUnsavedTrackingRef.current = true
      reset(formValues)
      setIsFormInitialized(true)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Failed to load invoice data:', error)
    }
  }, [isEditMode, existingInvoice, reset, storageKey, isFormInitialized])

  // Restore draft from localStorage on mount (create mode only)
  useEffect(() => {
    if (isEditMode || isFormInitialized) return

    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) {
        skipUnsavedTrackingRef.current = true
        setIsFormInitialized(true)
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
      setIsFormInitialized(true)
      setHasUnsavedChanges(false)
      setLastSaved(null)
      setSaveError(null)
    } catch (error) {
      skipUnsavedTrackingRef.current = true
      setIsFormInitialized(true)
      console.error('Failed to restore draft:', error)
    }
  }, [isEditMode, reset, storageKey, isFormInitialized])

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
      localStorage.removeItem(storageKey)
    }

    navigate('/')
  }, [getValues, hasUnsavedChanges, navigate, storageKey])

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

        if (isEditMode && invoiceId) {
          // Edit mode: Build update payload with invoice_lines_attributes
          // Track which original line IDs we're keeping
          const originalLineIds = new Set(
            existingInvoice?.invoice_lines
              ?.map((line) => line.id)
              .filter(Boolean) || []
          )
          const updatedLineIds = new Set(
            values.lineItems
              .map((item) => item.id)
              .filter((id): id is string => !!id)
          )

          const invoice_lines_attributes = [
            // Update or create line items
            ...values.lineItems.map((item) => {
              if (item.id) {
                // Update existing line
                return {
                  id: parseInt(item.id, 10),
                  product_id: item.product_id
                    ? parseInt(item.product_id, 10)
                    : undefined,
                  quantity: item.quantity,
                  label: item.label,
                }
              } else {
                // Create new line
                if (!item.product_id) {
                  throw new Error('Missing product for new line item')
                }
                return {
                  product_id: parseInt(item.product_id, 10),
                  quantity: item.quantity,
                }
              }
            }),
            // Delete removed lines
            ...Array.from(originalLineIds)
              .filter(
                (id): id is string =>
                  typeof id === 'string' && !updatedLineIds.has(id)
              )
              .map((id) => ({
                id: parseInt(id, 10),
                _destroy: true,
              })),
          ]

          const updatePayload = {
            id: parseInt(invoiceId, 10),
            customer_id: values.customer.id,
            date: values.date.toISOString().split('T')[0],
            deadline: values.deadline
              ? values.deadline.toISOString().split('T')[0]
              : null,
            paid: values.paid,
            invoice_lines_attributes,
          }

          await updateInvoice(invoiceId, updatePayload as any)
          localStorage.removeItem(storageKey)
          navigate('/')
        } else {
          // Create mode
          const invoice_lines_attributes = values.lineItems.map((item, idx) => {
            if (!item.product_id) {
              throw new Error(`Missing product for line item ${idx + 1}`)
            }
            return {
              product_id: parseInt(item.product_id, 10),
              quantity: item.quantity,
            }
          })

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
          localStorage.removeItem(storageKey)
          resetForm()
          navigate('/')
        }
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
        } else if (error.response?.status === 409) {
          // Concurrent edit conflict
          setSubmitError(
            'This invoice was updated by someone else. Please refresh and try again.'
          )
        } else {
          setSubmitError(
            `Unable to ${
              isEditMode ? 'update' : 'create'
            } invoice. Please check your connection and try again.`
          )
        }
        console.error(
          `Invoice ${isEditMode ? 'update' : 'creation'} error:`,
          error
        )
      }
    },
    [
      api,
      resetForm,
      setError,
      navigate,
      isEditMode,
      invoiceId,
      updateInvoice,
      existingInvoice,
      storageKey,
    ]
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

  // Show loading state while fetching invoice in edit mode
  if (isEditMode && isLoadingInvoice) {
    return (
      <div className="d-flex justify-content-center align-items-center mt-5 py-5">
        <span>Loading invoice...</span>
      </div>
    )
  }

  // Show error state if failed to load invoice in edit mode
  if (isEditMode && isInvoiceError) {
    return (
      <ErrorState
        title="Error Loading Invoice"
        message={
          invoiceError?.message ||
          'Unable to load invoice. Please try again later.'
        }
        actionLabel="Back to List"
        onAction={() => navigate('/')}
      />
    )
  }

  // Show read-only view if invoice is finalized
  if (isEditMode && existingInvoice?.finalized) {
    return (
      <FinalizedInvoiceAlert
        onBackToList={() => navigate('/')}
        onViewInvoice={() => navigate(`/invoice/${invoiceId}`)}
      />
    )
  }

  return (
    <div className="pb-4">
      <FormHeader
        isEditMode={isEditMode}
        invoiceNumber={existingInvoice?.invoice_number}
        invoiceId={invoiceId}
        isAutoSaving={isAutoSaving}
        lastSaved={lastSaved}
        saveError={saveError}
        submitError={submitError}
        onDismissSubmitError={() => setSubmitError(null)}
      />

      <Form onSubmit={handleSubmit(onSubmit)}>
        <InvoiceDetailsSection
          control={control}
          getValues={getValues}
          setValue={setValue}
        />

        <LineItemsSection
          control={control}
          fields={fields}
          lineItems={lineItems}
          perLine={perLine}
          handleProductSelect={handleProductSelect}
          addLineItem={addLineItem}
          removeLineItem={removeLineItem}
          duplicateLineItem={duplicateLineItem}
          createDefaultLineItem={createDefaultLineItem}
        />

        <TotalsSection totals={totals} />

        <FormActions
          isEditMode={isEditMode}
          isSubmitting={isSubmitting}
          isUpdating={isUpdating}
          hasValidationErrors={hasValidationErrors}
          onCancel={handleCancel}
        />
      </Form>
    </div>
  )
}

export default InvoiceForm
