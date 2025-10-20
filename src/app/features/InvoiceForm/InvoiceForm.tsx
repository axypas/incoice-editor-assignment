/**
 * InvoiceForm component (US3, US4)
 * Supports both create and edit modes
 * Simplified version using extracted components, hooks, and types
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useForm, useFieldArray, FormProvider } from 'react-hook-form'
import { Form } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import {
  FormHeader,
  InvoiceDetailsSection,
  LineItemsSection,
  TotalsSection,
  FormActions,
  FinalizeConfirmationModal,
  InvoiceFormWrapper,
} from './components'
import {
  useInvoiceDraft,
  useLineItemActions,
  useInvoiceCalculations,
  useInvoiceSubmit,
  useInvoiceFormInitialization,
} from './hooks'
import { Customer, Product } from 'common/types'
import { Invoice } from 'common/types/invoice.types'
import 'react-datepicker/dist/react-datepicker.css'

/**
 * Represents a single line item in the invoice form
 */
export interface LineItemFormValue {
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

/**
 * Complete form values structure for the invoice form
 */
export interface InvoiceFormValues {
  customer: Customer | null
  date: Date | null
  deadline: Date | null
  paid: boolean
  finalized: boolean
  lineItems: LineItemFormValue[]
}

/**
 * Creates a default empty line item
 */
const createDefaultLineItem = (): LineItemFormValue => ({
  product: null,
  product_id: undefined,
  label: '',
  quantity: 1,
  unit: 'piece',
  unit_price: 0,
  vat_rate: '0',
})

/**
 * Auto-save debounce delay in milliseconds (30 seconds)
 */
const AUTOSAVE_DELAY_MS = 30000

/**
 * Inner form component that handles the actual form logic
 * Wrapped by InvoiceFormWrapper for loading/error states
 */
const InvoiceFormInner = ({
  isEditMode,
  invoiceId,
  existingInvoice,
}: {
  isEditMode: boolean
  invoiceId?: string
  existingInvoice: Invoice | null
}): JSX.Element => {
  const navigate = useNavigate()
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)

  // Calculate storage key upfront
  const storageKey =
    isEditMode && invoiceId ? `draft-invoice-${invoiceId}` : 'invoice_draft'

  const methods = useForm<InvoiceFormValues>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
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
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = methods

  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: 'lineItems',
  })

  // Draft management hook
  const {
    isAutoSaving,
    lastSaved,
    saveError,
    handleAutoSave,
    restoreDraft,
    clearDraft,
  } = useInvoiceDraft({
    storageKey,
    enabled: true,
    isDirty,
  })

  // Form initialization hook
  const { isFormInitialized } = useInvoiceFormInitialization({
    isEditMode,
    invoiceId,
    existingInvoice,
    reset,
    restoreDraft,
  })

  // Auto-save on form changes when dirty
  useEffect(() => {
    if (!isDirty) return

    const currentValues = getValues()
    if (!currentValues.customer || currentValues.lineItems.length === 0) return

    const timer = setTimeout(() => {
      handleAutoSave(currentValues)
    }, AUTOSAVE_DELAY_MS)

    return () => clearTimeout(timer)
  }, [isDirty, getValues, handleAutoSave])

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
    existingInvoice,
    setError,
    onSuccess: clearDraft,
  })

  // Invoice calculations hook - watch lineItems for reactive updates
  const watchedLineItems = watch('lineItems') || []
  const { totals, perLine, lineItems } = useInvoiceCalculations({
    lineItems: watchedLineItems,
  })

  const handleCancel = useCallback(() => {
    // In edit mode, only check if form is dirty (user made changes)
    // In create mode, check if user has entered any data
    const hasUnsavedChanges = isEditMode
      ? isDirty
      : isDirty ||
        getValues('customer') !== null ||
        getValues('lineItems').some((item) => item.product_id !== undefined)

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      )
      if (!confirmed) {
        return
      }
      clearDraft()
    }

    navigate('/')
  }, [isEditMode, isDirty, getValues, navigate, clearDraft])

  const handleFinalizeClick = useCallback(async () => {
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
    rhfHandleSubmit(handleSubmit)()
  }, [setValue, rhfHandleSubmit, handleSubmit])

  const hasValidationErrors =
    !!errors.customer ||
    !!errors.date ||
    !!errors.deadline ||
    !!errors.lineItems

  if (!isFormInitialized) {
    return (
      <div className="d-flex justify-content-center align-items-center mt-5 py-5">
        <span>Initializing form...</span>
      </div>
    )
  }

  return (
    <div className="pb-4">
      <FormHeader
        isEditMode={isEditMode}
        invoiceNumber={existingInvoice?.id}
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

/**
 * Main InvoiceForm component
 * Uses InvoiceFormWrapper to handle loading/error states
 */
const InvoiceForm = (): JSX.Element => {
  return (
    <InvoiceFormWrapper>
      {(props) => <InvoiceFormInner {...props} />}
    </InvoiceFormWrapper>
  )
}

export default InvoiceForm
