/**
 * useInvoiceDraft hook
 * Manages localStorage draft saving and restoration
 */

import { useState, useCallback, useEffect } from 'react'
import type { Customer, Product } from 'common/types'

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
  lineItems: LineItemFormValue[]
}

interface DraftBackup {
  customer: Customer | null
  date: string | null
  deadline: string | null
  paid: boolean
  lineItems: LineItemFormValue[]
}

interface UseInvoiceDraftOptions {
  storageKey: string
  enabled: boolean
}

interface UseInvoiceDraftReturn {
  isAutoSaving: boolean
  lastSaved: Date | null
  saveError: string | null
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (value: boolean) => void
  handleAutoSave: (values: InvoiceFormValues) => Promise<void>
  restoreDraft: () => InvoiceFormValues | null
  clearDraft: () => void
}

export const useInvoiceDraft = ({
  storageKey,
  enabled,
}: UseInvoiceDraftOptions): UseInvoiceDraftReturn => {
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const handleAutoSave = useCallback(
    async (values: InvoiceFormValues) => {
      if (!enabled || !values.customer || values.lineItems.length === 0) {
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
    [storageKey, enabled]
  )

  const restoreDraft = useCallback((): InvoiceFormValues | null => {
    if (!enabled) return null

    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return null

      const parsed = JSON.parse(saved) as DraftBackup
      return {
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
            : [],
      }
    } catch (error) {
      console.error('Failed to restore draft:', error)
      return null
    }
  }, [storageKey, enabled])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey)
    setLastSaved(null)
    setSaveError(null)
    setHasUnsavedChanges(false)
  }, [storageKey])

  // Warn on navigation if there are unsaved changes
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault()
        event.returnValue =
          'You have unsaved changes. Are you sure you want to leave?'
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges, enabled])

  return {
    isAutoSaving,
    lastSaved,
    saveError,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    handleAutoSave,
    restoreDraft,
    clearDraft,
  }
}
