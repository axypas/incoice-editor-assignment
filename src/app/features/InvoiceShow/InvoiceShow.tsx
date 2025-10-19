/**
 * InvoiceShow component
 * Displays invoice details in read-only mode
 * Orchestrates sub-components for better maintainability
 */

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import numeral from 'numeral'
import { useInvoice } from 'app/features/InvoicesList/hooks/useInvoices'
import { ensureNumber } from 'common/utils/calculations'
import LoadingState from './components/LoadingState'
import ErrorState from './components/ErrorState'
import InvoiceHeader from './components/InvoiceHeader'
import InvoiceDetails from './components/InvoiceDetails'
import LineItemsTable from './components/LineItemsTable'
import InvoiceTotals from './components/InvoiceTotals'

const InvoiceShow: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { invoice, isLoading, isError, error } = useInvoice(id || '')

  // Helper function to format dates
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  // Loading state
  if (isLoading) {
    return <LoadingState message="Loading invoice..." />
  }

  // Error state
  if (isError || !invoice) {
    return (
      <ErrorState
        title="Error Loading Invoice"
        message={
          error?.message || 'Unable to load invoice. Please try again later.'
        }
        actionLabel="Back to List"
        onAction={() => navigate('/')}
      />
    )
  }

  // Calculate totals (convert strings to numbers if needed)
  const total = ensureNumber(invoice.total)
  const tax = ensureNumber(invoice.tax)
  // Use numeral.js for subtraction to maintain consistency
  const subtotal = numeral(total).subtract(tax).value() || 0

  return (
    <div className="pb-4">
      <InvoiceHeader
        invoice={invoice}
        onEdit={() => navigate(`/invoices/${invoice.id}/edit`)}
        onBackToList={() => navigate('/')}
      />

      <InvoiceDetails invoice={invoice} formatDate={formatDate} />

      <LineItemsTable invoice={invoice} />

      <InvoiceTotals subtotal={subtotal} tax={tax} total={total} />
    </div>
  )
}

export default InvoiceShow
