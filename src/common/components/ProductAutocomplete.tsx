import { useCallback } from 'react'
import { AsyncPaginate, LoadOptions } from 'react-select-async-paginate'

import { Product } from 'common/types'
import { useApi } from 'api'
import { GroupBase } from 'react-select'
import { logger } from 'common/utils/logger'
import { DEFAULT_PAGE_SIZE } from 'common/constants/ui'

interface Props {
  value: Product | null
  onChange: (product: Product | null) => void
  onBlur?: () => void
  inputId?: string
}

const defaultAdditional = { page: 1 }

const getProductLabel = (product: Product) => {
  return product.label
}

const ProductAutocomplete = ({ value, onChange, onBlur, inputId }: Props) => {
  const api = useApi()

  const loadOptions: LoadOptions<
    Product,
    GroupBase<Product>,
    { page: number }
  > = useCallback(
    async (search, _, additional) => {
      try {
        const page = additional?.page ?? 1
        const { data } = await api.getSearchProducts({
          query: search,
          per_page: DEFAULT_PAGE_SIZE,
          page,
        })

        return {
          options: data.products,
          hasMore: data.pagination.page < data.pagination.total_pages,
          additional: {
            page: page + 1,
          },
        }
      } catch (error) {
        logger.error('Failed to load products:', error)
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
      aria-label={!inputId ? 'Search a product' : undefined}
      placeholder="Search a product"
      getOptionLabel={getProductLabel}
      additional={defaultAdditional}
      menuPortalTarget={document.body}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      loadOptions={loadOptions}
      loadingMessage={() => 'Loading products...'}
      noOptionsMessage={({ inputValue }) =>
        inputValue ? 'No products found' : 'Start typing to search'
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

export default ProductAutocomplete
