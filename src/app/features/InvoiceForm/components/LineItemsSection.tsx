/**
 * LineItemsSection component
 * Displays line items table with product selection, quantity, pricing, and actions
 */

import {
  Card,
  Button,
  Table,
  Form,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap'
import { Controller, Control, FieldArrayWithId } from 'react-hook-form'
import { ProductAutocomplete } from 'common/components'
import { formatCurrency } from 'common/utils/calculations'
import type { Product } from 'common/types'
import type { LineItemCalculation as ImportedLineItemCalculation } from 'common/types/invoice.types'
import { LineItemFormValue, InvoiceFormValues } from '../types'
import { createDefaultLineItem } from '../utils'
import numeral from 'numeral'

type LineItemCalculation = ImportedLineItemCalculation

interface LineItemsSectionProps {
  control: Control<InvoiceFormValues>
  fields: FieldArrayWithId<InvoiceFormValues, 'lineItems', 'id'>[]
  lineItems: LineItemFormValue[]
  perLine: LineItemCalculation[]
  handleProductSelect: (index: number, product: Product | null) => void
  addLineItem: () => void
  removeLineItem: (index: number) => void
  duplicateLineItem: (index: number) => void
}

const LineItemsSection = ({
  control,
  fields,
  lineItems,
  perLine,
  handleProductSelect,
  addLineItem,
  removeLineItem,
  duplicateLineItem,
}: LineItemsSectionProps): JSX.Element => {
  return (
    <Card className="mb-4 shadow-sm rounded-xl">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0 h5">Line Items</h3>
          <Button variant="primary" size="sm" onClick={addLineItem}>
            + Add Line
          </Button>
        </div>

        <div className="table-responsive">
          <Table hover className="text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" style={{ width: '26%' }}>
                  Product
                </th>
                <th scope="col" style={{ width: '10%' }}>
                  Qty
                </th>
                <th scope="col" style={{ width: '10%' }}>
                  Unit
                </th>
                <th scope="col" style={{ width: '12%' }}>
                  Price
                </th>
                <th scope="col" style={{ width: '10%' }}>
                  Tax %
                </th>
                <th scope="col" style={{ width: '12%' }} className="text-end">
                  Tax Amount
                </th>
                <th scope="col" style={{ width: '12%' }} className="text-end">
                  Total
                </th>
                <th
                  scope="col"
                  style={{ width: '8%' }}
                  aria-label="Actions"
                ></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const item = lineItems[index] ?? createDefaultLineItem()
                const calculation = perLine[index]

                return (
                  <tr key={field.id} className="align-middle">
                    <td>
                      <Controller
                        name={`lineItems.${index}.product`}
                        control={control}
                        rules={{
                          validate: (value) =>
                            value ? true : 'Please select a product',
                        }}
                        render={({ field: productField, fieldState }) => (
                          <>
                            <ProductAutocomplete
                              value={productField.value}
                              onChange={(product) => {
                                productField.onChange(product)
                                handleProductSelect(index, product)
                              }}
                              onBlur={productField.onBlur}
                            />
                            {fieldState.error && (
                              <Form.Text className="text-danger">
                                {fieldState.error.message}
                              </Form.Text>
                            )}
                          </>
                        )}
                      />
                    </td>
                    <td>
                      <Controller
                        name={`lineItems.${index}.quantity`}
                        control={control}
                        rules={{
                          required: 'Quantity must be greater than 0',
                          validate: (value) =>
                            value > 0 || 'Quantity must be greater than 0',
                        }}
                        render={({ field: quantityField, fieldState }) => (
                          <>
                            <Form.Control
                              type="number"
                              size="sm"
                              min="0"
                              step="1"
                              disabled={!item.product_id}
                              aria-label={`Quantity for ${
                                item.label || 'line item'
                              }`}
                              value={
                                Number.isFinite(quantityField.value)
                                  ? quantityField.value
                                  : ''
                              }
                              onChange={(event) => {
                                const nextValue = Number(event.target.value)
                                quantityField.onChange(
                                  Number.isNaN(nextValue) ? 0 : nextValue
                                )
                              }}
                              onBlur={quantityField.onBlur}
                            />
                            {fieldState.error && (
                              <Form.Text className="text-danger">
                                {fieldState.error.message}
                              </Form.Text>
                            )}
                          </>
                        )}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        size="sm"
                        value={item.unit}
                        readOnly
                        disabled
                        aria-label={`Unit for ${item.label || 'line item'}`}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        value={item.unit_price}
                        readOnly
                        disabled
                        aria-label={`Unit price for ${
                          item.label || 'line item'
                        }`}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        size="sm"
                        value={item.vat_rate}
                        readOnly
                        disabled
                        aria-label={`VAT rate for ${item.label || 'line item'}`}
                      />
                    </td>
                    <td className="text-end">
                      <strong>
                        {formatCurrency(
                          item.product?.unit_tax
                            ? numeral(item.quantity)
                                .multiply(
                                  numeral(item.product.unit_tax).value() ?? 0
                                )
                                .value() ?? 0
                            : 0
                        )}
                      </strong>
                    </td>
                    <td className="text-end">
                      <strong>{formatCurrency(calculation?.total ?? 0)}</strong>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => duplicateLineItem(index)}
                          title={`Duplicate line item: ${
                            item.label || 'Unnamed'
                          }`}
                        >
                          Copy
                        </Button>
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip id={`remove-line-${index}-tooltip`}>
                              {fields.length === 1
                                ? 'Invoice must have at least one line item'
                                : `Remove line item: ${
                                    item.label || 'Unnamed'
                                  }`}
                            </Tooltip>
                          }
                        >
                          <span className="d-inline-block">
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                              disabled={fields.length === 1}
                              title={`Remove line item: ${
                                item.label || 'Unnamed'
                              }`}
                              className={
                                fields.length === 1
                                  ? 'pointer-events-none'
                                  : 'pointer-events-auto'
                              }
                            >
                              Remove
                            </Button>
                          </span>
                        </OverlayTrigger>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  )
}

export default LineItemsSection
