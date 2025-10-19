/**
 * Hook for managing invoice sort state
 * Handles sort field, direction, and mapping to backend field names
 */

import { useState, useCallback, useMemo } from 'react'

interface UseInvoiceSortReturn {
  sortField: string
  sortDirection: 'asc' | 'desc'
  sortParam: string
  handleSort: (field: string) => void
}

export const useInvoiceSort = (): UseInvoiceSortReturn => {
  // Sort state - default to deadline ascending to show overdue invoices first
  const [sortField, setSortField] = useState<string>('deadline')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Mapping between UI column IDs and backend sort field names
  const sortFieldMapping: Record<string, string> = useMemo(
    () => ({
      id: 'id',
      date: 'date',
      deadline: 'deadline',
      total: 'total',
      status: 'finalized',
    }),
    []
  )

  // Build sort parameter for API (e.g., "-date" or "+customer.first_name")
  const backendSortField = sortFieldMapping[sortField] || sortField
  const sortParam = `${sortDirection === 'desc' ? '-' : '+'}${backendSortField}`

  // Handle column sort
  const handleSort = useCallback(
    (field: string) => {
      if (field === sortField) {
        // Toggle direction if clicking the same field
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
      } else {
        // New field, default to ascending
        setSortField(field)
        setSortDirection('asc')
      }
    },
    [sortField, sortDirection]
  )

  return {
    sortField,
    sortDirection,
    sortParam,
    handleSort,
  }
}
