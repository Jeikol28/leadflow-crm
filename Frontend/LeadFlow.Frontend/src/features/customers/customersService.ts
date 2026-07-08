import { httpClient } from '../../shared/api/httpClient'
import type { PagedResponse } from '../../shared/api/pagination'
import type { Customer, CustomerInput } from './customers.types'

// Listado paginado de clientes de la empresa autenticada.
export async function getCustomers(page: number, pageSize: number) {
  const response = await httpClient.get<PagedResponse<Customer>>('/customers', {
    params: { Page: page, PageSize: pageSize },
  })
  return response.data
}

export async function getCustomer(id: number) {
  const response = await httpClient.get<Customer>(`/customers/${id}`)
  return response.data
}

export async function createCustomer(input: CustomerInput) {
  const response = await httpClient.post<Customer>('/customers', input)
  return response.data
}

export async function updateCustomer(id: number, input: CustomerInput) {
  const response = await httpClient.put<Customer>(`/customers/${id}`, input)
  return response.data
}

// Desactiva (soft delete) un cliente.
export async function deleteCustomer(id: number) {
  await httpClient.delete(`/customers/${id}`)
}