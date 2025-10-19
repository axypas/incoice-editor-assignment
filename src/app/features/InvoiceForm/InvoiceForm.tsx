/**
 * InvoiceForm component (US3, US4)
 * Supports both create and edit modes
 * Rewritten to rely on react-hook-form for field and validation management.
 * Keeps existing UX: on-blur validation, autosave, local-storage draft, and safety guards.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useForm, useFieldArray, useWatch, FormProvider } from 'react-hook-form'
import { Form } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import { Customer, Product } from 'common/types'
import { useInvoice } from 'app/features/InvoicesList/hooks/useInvoices'
import {
  FinalizedInvoiceAlert,
  FormHeader,
  InvoiceDetailsSection,
  LineItemsSection,
  TotalsSection,
  FormActions,
  FinalizeConfirmationModal,
} from './components'
import {
  useInvoiceDraft,
  useLineItemActions,
  useInvoiceCalculations,
  useInvoiceSubmit,
} from './hooks'
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
  finalized: boolean
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
  finalized: false,
  paid: false,
  lineItems: [createDefaultLineItem()],
})

const InvoiceForm = (): JSX.Element => {
  const navigate = useNavigate()
  const { id: invoiceId } = useParams<{ id: string }>()
  const isEditMode = !!invoiceId

  // Fetch invoice data if in edit mode
  const {
    invoice: existingInvoice,
    isLoading: isLoadingInvoice,
    isError: isInvoiceError,
    error: invoiceError,
  } = useInvoice(invoiceId || '')

  const [isFormInitialized, setIsFormInitialized] = useState(false)
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)

  const defaultValuesRef = useRef<InvoiceFormValues>(createDefaultValues())
  const skipUnsavedTrackingRef = useRef(true)
  const storageKey =
    isEditMode && invoiceId ? getEditStorageKey(invoiceId) : STORAGE_KEY

  const methods = useForm<InvoiceFormValues>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: defaultValuesRef.current,
  })

  const {
    control,
    handleSubmit: rhfHandleSubmit,
    reset,
    getValues,
    setValue,
    clearErrors,
    setError,
    trigger,
    formState: { errors, isSubmitting },
  } = methods

  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: 'lineItems',
  })

  const watchedValues = useWatch<InvoiceFormValues>({ control })

  // Draft management hook
  const {
    isAutoSaving,
    lastSaved,
    saveError,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    handleAutoSave,
    restoreDraft,
    clearDraft,
  } = useInvoiceDraft({
    storageKey,
    enabled: true,
  })

  // Pre-populate form from existing invoice in edit mode
  useEffect(() => {
    if (!isEditMode || !existingInvoice || isFormInitialized) return

    try {
      // Check localStorage for draft first (unsaved changes)
      const draft = restoreDraft()
      if (draft && draft.lineItems.length > 0) {
        defaultValuesRef.current = draft
        reset(draft)
        setIsFormInitialized(true)
        return
      }

      // Otherwise populate from existing invoice
      // Convert customer from domain type (id: string) to API type (id: number)
      const customerForForm: Customer | null = existingInvoice.customer
        ? {
            id: parseInt(existingInvoice.customer.id, 10),
            first_name: existingInvoice.customer.first_name,
            last_name: existingInvoice.customer.last_name,
            address: existingInvoice.customer.address || '',
            zip_code: existingInvoice.customer.zip_code || '',
            city: existingInvoice.customer.city || '',
            country: existingInvoice.customer.country || '',
            country_code: existingInvoice.customer.country_code || '',
          }
        : null

      const formValues: InvoiceFormValues = {
        customer: customerForForm,
        date: existingInvoice.date ? new Date(existingInvoice.date) : null,
        deadline: existingInvoice.deadline
          ? new Date(existingInvoice.deadline)
          : null,
        finalized: false, // Always false for draft invoices being edited
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
  }, [
    isEditMode,
    existingInvoice,
    reset,
    isFormInitialized,
    restoreDraft,
    setHasUnsavedChanges,
  ])

  // Restore draft from localStorage on mount (create mode only)
  useEffect(() => {
    if (isEditMode || isFormInitialized) return

    try {
      const draft = restoreDraft()
      if (!draft) {
        skipUnsavedTrackingRef.current = true
        setIsFormInitialized(true)
        return
      }

      const restored: InvoiceFormValues = {
        ...draft,
        lineItems:
          draft.lineItems && draft.lineItems.length > 0
            ? draft.lineItems
            : [createDefaultLineItem()],
      }

      defaultValuesRef.current = restored
      reset(restored)
      setIsFormInitialized(true)
      setHasUnsavedChanges(false)
    } catch (error) {
      skipUnsavedTrackingRef.current = true
      setIsFormInitialized(true)
      console.error('Failed to restore draft:', error)
    }
  }, [isEditMode, reset, isFormInitialized, restoreDraft, setHasUnsavedChanges])

  // Track dirty state manually so autosave and navigation guard stay in sync
  useEffect(() => {
    if (skipUnsavedTrackingRef.current) {
      skipUnsavedTrackingRef.current = false
      return
    }
    setHasUnsavedChanges(true)
  }, [watchedValues, setHasUnsavedChanges])

  // Auto-save on form changes with 30s debounce
  useEffect(() => {
    if (!hasUnsavedChanges) return

    // Get complete form values directly from react-hook-form
    const currentValues = getValues()
    if (!currentValues.customer || currentValues.lineItems.length === 0) return

    const timer = setTimeout(() => {
      handleAutoSave(currentValues)
    }, 30000)

    return () => clearTimeout(timer)
  }, [hasUnsavedChanges, getValues, handleAutoSave])

  // Line item actions hook
  const {
    handleProductSelect,
    addLineItem,
    removeLineItem,
    duplicateLineItem,
  } = useLineItemActions({
    setValue,
    clearErrors,
    getValues,
    fields,
    append,
    remove,
    insert,
    createDefaultLineItem,
  })

  // Invoice submit hook
  const { submitError, setSubmitError, handleSubmit } = useInvoiceSubmit({
    isEditMode,
    invoiceId,
    existingInvoice: existingInvoice || undefined,
    setError,
    onSuccess: clearDraft,
  })

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
      clearDraft()
    }

    navigate('/')
  }, [getValues, hasUnsavedChanges, navigate, clearDraft])

  const handleFinalizeClick = useCallback(async () => {
    // Validate the form first
    const isValid = await trigger()
    if (!isValid) {
      return
    }
    setShowFinalizeModal(true)
  }, [trigger])

  const handleFinalizeCancel = useCallback(() => {
    setShowFinalizeModal(false)
  }, [])

  const handleFinalizeConfirm = useCallback(() => {
    setShowFinalizeModal(false)
    setValue('finalized', true, { shouldDirty: true })
    // Trigger form submission
    rhfHandleSubmit(handleSubmit)()
  }, [setValue, rhfHandleSubmit, handleSubmit])

  // Invoice calculations hook
  const { totals, perLine, lineItems } = useInvoiceCalculations({
    lineItems: getValues('lineItems') || [],
  })

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

      <FormProvider {...methods}>
        <Form onSubmit={rhfHandleSubmit(handleSubmit)}>
          <InvoiceDetailsSection />

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
            isUpdating={false}
            hasValidationErrors={hasValidationErrors}
            onCancel={handleCancel}
            onFinalizeClick={handleFinalizeClick}
          />
        </Form>
      </FormProvider>

      <FinalizeConfirmationModal
        show={showFinalizeModal}
        isEditMode={isEditMode}
        onConfirm={handleFinalizeConfirm}
        onCancel={handleFinalizeCancel}
      />
    </div>
  )
}

export default InvoiceForm
