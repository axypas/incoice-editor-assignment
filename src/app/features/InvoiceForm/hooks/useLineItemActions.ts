/**
 * useLineItemActions hook
 * Manages line item actions: add, remove, duplicate, product selection
 */

import { useCallback } from 'react'
import type {
  UseFormSetValue,
  UseFormClearErrors,
  UseFormGetValues,
  FieldArrayWithId,
} from 'react-hook-form'
import type { Product } from 'common/types'

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
  customer: any
  date: Date | null
  deadline: Date | null
  paid: boolean
  lineItems: LineItemFormValue[]
}

interface UseLineItemActionsOptions {
  setValue: UseFormSetValue<InvoiceFormValues>
  clearErrors: UseFormClearErrors<InvoiceFormValues>
  getValues: UseFormGetValues<InvoiceFormValues>
  fields: FieldArrayWithId<InvoiceFormValues, 'lineItems', 'id'>[]
  append: (value: LineItemFormValue) => void
  remove: (index: number) => void
  insert: (index: number, value: LineItemFormValue) => void
  createDefaultLineItem: () => LineItemFormValue
}

interface UseLineItemActionsReturn {
  handleProductSelect: (index: number, product: Product | null) => void
  addLineItem: () => void
  removeLineItem: (index: number) => void
  duplicateLineItem: (index: number) => void
}

export const useLineItemActions = ({
  setValue,
  clearErrors,
  getValues,
  fields,
  append,
  remove,
  insert,
  createDefaultLineItem,
}: UseLineItemActionsOptions): UseLineItemActionsReturn => {
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
    [setValue, clearErrors, createDefaultLineItem]
  )

  const addLineItem = useCallback(() => {
    append(createDefaultLineItem())
  }, [append, createDefaultLineItem])

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

  return {
    handleProductSelect,
    addLineItem,
    removeLineItem,
    duplicateLineItem,
  }
}
