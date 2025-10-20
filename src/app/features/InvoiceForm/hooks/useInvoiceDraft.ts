/**
 * useInvoiceDraft hook
 * Manages localStorage draft saving and restoration
 */

import { useState, useCallback, useEffect } from 'react'
import type { Customer } from 'common/types'
import { logger } from 'common/utils/logger'
import { LineItemFormValue, InvoiceFormValues } from '../types'

interface DraftBackup {
  customer: Customer | null
  date: string | null
  deadline: string | null
  paid: boolean
  finalized: boolean
  lineItems: LineItemFormValue[]
}

interface UseInvoiceDraftOptions {
  storageKey: string
  enabled: boolean
  isDirty?: boolean
}

interface UseInvoiceDraftReturn {
  isAutoSaving: boolean
  lastSaved: Date | null
  saveError: string | null
  handleAutoSave: (values: InvoiceFormValues) => Promise<void>
  restoreDraft: () => InvoiceFormValues | null
  clearDraft: () => void
}

export const useInvoiceDraft = ({
  storageKey,
  enabled,
  isDirty = false,
}: UseInvoiceDraftOptions): UseInvoiceDraftReturn => {
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

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
          finalized: values.finalized,
          lineItems: values.lineItems.map((item) => ({
            ...item,
            product: item.product ? { ...item.product } : null,
          })),
        }

        localStorage.setItem(storageKey, JSON.stringify(snapshot))
        setLastSaved(new Date())
      } catch (error) {
        setSaveError('Unable to save. Your changes are preserved locally.')
        logger.error('Invoice autosave failed:', error)
      } finally {
        setIsAutoSaving(false)
      }
    },
    [storageKey, enabled]
  )

  const isDraftBackup = (obj: unknown): obj is DraftBackup => {
    if (typeof obj !== 'object' || obj === null) return false
    if (!('customer' in obj)) return false
    if (!('date' in obj)) return false
    if (!('deadline' in obj)) return false
    if (!('paid' in obj)) return false
    if (!('finalized' in obj)) return false
    if (!('lineItems' in obj)) return false

    const { customer, date, deadline, paid, finalized, lineItems } = obj

    return (
      (customer === null ||
        (typeof customer === 'object' && customer !== null)) &&
      (date === null || typeof date === 'string') &&
      (deadline === null || typeof deadline === 'string') &&
      typeof paid === 'boolean' &&
      typeof finalized === 'boolean' &&
      Array.isArray(lineItems)
    )
  }

  const restoreDraft = useCallback((): InvoiceFormValues | null => {
    if (!enabled) return null

    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return null

      const parsed: unknown = JSON.parse(saved)
      if (!isDraftBackup(parsed)) {
        logger.error('Invalid draft format in localStorage')
        return null
      }

      return {
        customer: parsed.customer ?? null,
        date: parsed.date ? new Date(parsed.date) : null,
        deadline: parsed.deadline ? new Date(parsed.deadline) : null,
        paid: parsed.paid ?? false,
        finalized: parsed.finalized ?? false,
        lineItems:
          parsed.lineItems && parsed.lineItems.length > 0
            ? parsed.lineItems.map((item) => ({
                ...item,
                product: item.product ? { ...item.product } : null,
              }))
            : [],
      }
    } catch (error) {
      logger.error('Failed to restore draft:', error)
      return null
    }
  }, [storageKey, enabled])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey)
    setLastSaved(null)
    setSaveError(null)
  }, [storageKey])

  // Warn on navigation if there are unsaved changes
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault()
        event.returnValue =
          'You have unsaved changes. Are you sure you want to leave?'
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, enabled])

  return {
    isAutoSaving,
    lastSaved,
    saveError,
    handleAutoSave,
    restoreDraft,
    clearDraft,
  }
}
