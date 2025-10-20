/**
 * InvoiceShow component
 * Displays invoice details in read-only mode
 * Orchestrates sub-components for better maintainability
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useInvoice } from 'app/features/InvoicesList/hooks/useInvoices'
import LoadingState from './components/LoadingState'
import ErrorState from './components/ErrorState'
import InvoiceHeader from './components/InvoiceHeader'
import InvoiceDetails from './components/InvoiceDetails'
import LineItemsTable from './components/LineItemsTable'
import InvoiceTotals from './components/InvoiceTotals'

const InvoiceShow = (): JSX.Element => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { invoice, isLoading, isError, error } = useInvoice(id || '')

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

  return (
    <div className="pb-4">
      <InvoiceHeader
        invoice={invoice}
        onEdit={() => navigate(`/invoices/${invoice.id}/edit`)}
        onBackToList={() => navigate('/')}
      />

      <InvoiceDetails invoice={invoice} />

      <LineItemsTable invoice={invoice} />

      <InvoiceTotals tax={invoice.tax} total={invoice.total} />
    </div>
  )
}

export default InvoiceShow
