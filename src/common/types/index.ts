import { OperationMethods } from 'api/gen/client'

export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T

export type Invoice = Awaited<
  ReturnType<OperationMethods['getInvoices']>
>['data']['invoices'][0]

export type Product = Awaited<
  ReturnType<OperationMethods['getSearchProducts']>
>['data']['products'][0]

export type Customer = Awaited<
  ReturnType<OperationMethods['getSearchCustomers']>
>['data']['customers'][0]

// Extract InvoiceLine from Invoice.invoice_lines
export type InvoiceLine = Invoice['invoice_lines'][0]
