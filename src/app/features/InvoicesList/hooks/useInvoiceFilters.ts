/**
 * Hook for managing invoice filter state and logic
 * Handles filter form, building filter params, and filter comparison
 */

import { useState, useCallback, useMemo, useRef } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { InvoiceFilter } from 'common/types/invoice.types'
import { Customer, Product } from 'common/types'

export type StatusFilter = 'all' | 'draft' | 'finalized'
export type PaymentFilter = 'all' | 'paid' | 'unpaid'

export interface FilterFormData {
  dateRange: [Date | null, Date | null]
  dueDateRange: [Date | null, Date | null]
  status: StatusFilter
  payment: PaymentFilter
  customer: Customer | null
  product: Product | null
}

interface UseInvoiceFiltersReturn {
  filterControl: UseFormReturn<FilterFormData>['control']
  handleFilterSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  handleClearFilters: () => void
  activeFilters: InvoiceFilter[]
  hasActiveFilters: boolean
  hasChangedFilters: boolean
  filterSummary: string
  currentFilters: FilterFormData
  setActiveFilters: (filters: InvoiceFilter[]) => void
  setFilterValue: UseFormReturn<FilterFormData>['setValue']
}

const defaultFilterValues: FilterFormData = {
  dateRange: [null, null],
  dueDateRange: [null, null],
  status: 'all',
  payment: 'all',
  customer: null,
  product: null,
}

export const useInvoiceFilters = (): UseInvoiceFiltersReturn => {
  const defaultFilterValuesRef = useRef<FilterFormData>(defaultFilterValues)

  const {
    control: filterControl,
    handleSubmit: handleFilterFormSubmit,
    reset: resetFilterForm,
    watch: watchFilterForm,
    setValue: setFilterValue,
  } = useForm<FilterFormData>({
    mode: 'onSubmit',
    defaultValues: defaultFilterValuesRef.current,
  })

  const filterFormValues = watchFilterForm()
  const currentFilters = filterFormValues as FilterFormData
  const [activeFilters, setActiveFilters] = useState<InvoiceFilter[]>([])

  // Format date to YYYY-MM-DD for API
  const formatDateForAPI = useCallback((date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  // Build filters based on current form state
  const buildFilters = useCallback(
    (formData: FilterFormData): InvoiceFilter[] => {
      const filters: InvoiceFilter[] = []

      const [startDate, endDate] = formData.dateRange
      const [dueDateStart, dueDateEnd] = formData.dueDateRange

      if (startDate) {
        filters.push({
          field: 'date',
          operator: 'gteq',
          value: formatDateForAPI(startDate),
        })
      }

      if (endDate) {
        filters.push({
          field: 'date',
          operator: 'lteq',
          value: formatDateForAPI(endDate),
        })
      }

      if (dueDateStart) {
        filters.push({
          field: 'deadline',
          operator: 'gteq',
          value: formatDateForAPI(dueDateStart),
        })
      }

      if (dueDateEnd) {
        filters.push({
          field: 'deadline',
          operator: 'lteq',
          value: formatDateForAPI(dueDateEnd),
        })
      }

      if (formData.status !== 'all') {
        filters.push({
          field: 'finalized',
          operator: 'eq',
          value: formData.status === 'finalized' ? 'true' : 'false',
        })
      }

      if (formData.payment !== 'all') {
        filters.push({
          field: 'paid',
          operator: 'eq',
          value: formData.payment === 'paid' ? 'true' : 'false',
        })
      }

      if (formData.customer) {
        filters.push({
          field: 'customer_id',
          operator: 'eq',
          value: formData.customer.id.toString(),
        })
      }

      if (formData.product) {
        filters.push({
          field: 'invoice_lines.product_id',
          operator: 'eq',
          value: formData.product.id.toString(),
        })
      }

      return filters
    },
    [formatDateForAPI]
  )

  // Compare two filter arrays for equality
  const areFiltersEqual = useCallback(
    (filters1: InvoiceFilter[], filters2: InvoiceFilter[]): boolean => {
      if (filters1.length !== filters2.length) return false

      // Sort both arrays by field, operator, and value for consistent comparison
      const sort = (f: InvoiceFilter[]) =>
        [...f].sort((a, b) => {
          const fieldCompare = a.field.localeCompare(b.field)
          if (fieldCompare !== 0) return fieldCompare
          const opCompare = a.operator.localeCompare(b.operator)
          if (opCompare !== 0) return opCompare
          return String(a.value).localeCompare(String(b.value))
        })

      const sorted1 = sort(filters1)
      const sorted2 = sort(filters2)

      return sorted1.every(
        (f1, idx) =>
          f1.field === sorted2[idx].field &&
          f1.operator === sorted2[idx].operator &&
          f1.value === sorted2[idx].value
      )
    },
    []
  )

  // Check if filter form values differ from currently active filters
  const hasChangedFilters = useMemo(() => {
    const formFilters = buildFilters(currentFilters)
    return !areFiltersEqual(formFilters, activeFilters)
  }, [currentFilters, activeFilters, buildFilters, areFiltersEqual])

  // Check if any filters are active
  const hasActiveFilters = activeFilters.length > 0

  // Format active filter summary
  const getFilterSummary = useCallback((): string => {
    const parts: string[] = []

    if (currentFilters.status !== 'all') {
      parts.push(`Status: ${currentFilters.status}`)
    }
    if (currentFilters.payment !== 'all') {
      parts.push(`Payment: ${currentFilters.payment}`)
    }
    if (currentFilters.customer) {
      const customerName =
        `${currentFilters.customer.first_name} ${currentFilters.customer.last_name}`.trim()
      parts.push(`Customer: ${customerName}`)
    }
    if (currentFilters.product) {
      parts.push(`Product: ${currentFilters.product.label}`)
    }

    activeFilters.forEach((f) => {
      if (f.field === 'date') {
        if (f.operator === 'gteq') {
          parts.push(`Date from ${f.value}`)
        }
        if (f.operator === 'lteq') {
          parts.push(`Date to ${f.value}`)
        }
      }
      if (f.field === 'deadline') {
        if (f.operator === 'gteq') {
          parts.push(`Due date from ${f.value}`)
        }
        if (f.operator === 'lteq') {
          parts.push(`Due date to ${f.value}`)
        }
      }
    })

    return parts.join(', ')
  }, [currentFilters, activeFilters])

  const filterSummary = getFilterSummary()

  // Handle filter form submission
  const onFilterSubmit = useCallback(
    (values: FilterFormData) => {
      setActiveFilters(buildFilters(values))
    },
    [buildFilters]
  )
  const handleFilterSubmit = handleFilterFormSubmit(onFilterSubmit)

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    resetFilterForm(defaultFilterValuesRef.current)
    setActiveFilters([])
  }, [resetFilterForm])

  return {
    filterControl,
    handleFilterSubmit,
    handleClearFilters,
    activeFilters,
    hasActiveFilters,
    hasChangedFilters,
    filterSummary,
    currentFilters,
    setActiveFilters,
    setFilterValue,
  }
}
