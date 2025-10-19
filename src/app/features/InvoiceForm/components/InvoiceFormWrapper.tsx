/**
 * InvoiceFormWrapper component
 * Handles loading, error, and finalized states for the invoice form
 * Separates these concerns from the main form logic
 */

import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useInvoice } from 'app/features/InvoicesList/hooks/useInvoices'
import ErrorState from 'app/features/InvoiceShow/components/ErrorState'
import { FinalizedInvoiceAlert } from './index'

interface InvoiceFormWrapperProps {
  children: (props: {
    isEditMode: boolean
    invoiceId?: string
    existingInvoice: any
  }) => React.ReactElement
}

const InvoiceFormWrapper = ({
  children,
}: InvoiceFormWrapperProps): JSX.Element => {
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

  // Render the form with the loaded data
  return children({
    isEditMode,
    invoiceId,
    existingInvoice,
  })
}

export default InvoiceFormWrapper
