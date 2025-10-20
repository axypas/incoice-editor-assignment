import { useCallback } from 'react'
import { AsyncPaginate, LoadOptions } from 'react-select-async-paginate'

import { Customer } from 'common/types'
import { useApi } from 'api'
import { GroupBase } from 'react-select'
import { logger } from 'common/utils/logger'
import { DEFAULT_PAGE_SIZE } from 'common/constants/ui'

interface Props {
  value: Customer | null
  onChange: (Customer: Customer | null) => void
  onBlur?: () => void
  inputId?: string
}

const defaultAdditional = { page: 1 }

const getCustomerLabel = (customer: Customer) => {
  return `${customer.first_name} ${customer.last_name}`
}

const CustomerAutocomplete = ({ value, onChange, onBlur, inputId }: Props) => {
  const api = useApi()

  const loadOptions: LoadOptions<
    Customer,
    GroupBase<Customer>,
    { page: number }
  > = useCallback(
    async (search, _, additional) => {
      try {
        const page = additional?.page ?? 1
        const { data } = await api.getSearchCustomers({
          query: search,
          per_page: DEFAULT_PAGE_SIZE,
          page,
        })

        return {
          options: data.customers,
          hasMore: data.pagination.page < data.pagination.total_pages,
          additional: {
            page: page + 1,
          },
        }
      } catch (error) {
        logger.error('Failed to load customers:', error)
        return {
          options: [],
          hasMore: false,
          additional: {
            page: 1,
          },
        }
      }
    },
    [api]
  )

  return (
    <AsyncPaginate
      inputId={inputId}
      aria-label={!inputId ? 'Search a customer' : undefined}
      placeholder="Search a customer"
      getOptionLabel={getCustomerLabel}
      additional={defaultAdditional}
      menuPortalTarget={document.body}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      loadOptions={loadOptions}
      loadingMessage={() => 'Loading customers...'}
      noOptionsMessage={({ inputValue }) =>
        inputValue ? 'No customers found' : 'Start typing to search'
      }
      isClearable
      styles={{
        control: (base) => ({
          ...base,
          cursor: 'pointer',
        }),
      }}
    />
  )
}

export default CustomerAutocomplete
