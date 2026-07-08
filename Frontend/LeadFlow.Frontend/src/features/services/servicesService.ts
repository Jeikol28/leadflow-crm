import { httpClient } from '../../shared/api/httpClient'
import type { PagedResponse } from '../../shared/api/pagination'
import type { Service, ServiceInput } from './services.types'

export async function getServices(page: number, pageSize: number) {
  const response = await httpClient.get<PagedResponse<Service>>('/services', {
    params: { Page: page, PageSize: pageSize },
  })
  return response.data
}

export async function createService(input: ServiceInput) {
  const response = await httpClient.post<Service>('/services', input)
  return response.data
}

export async function updateService(id: number, input: ServiceInput) {
  const response = await httpClient.put<Service>(`/services/${id}`, input)
  return response.data
}

export async function deleteService(id: number) {
  await httpClient.delete(`/services/${id}`)
}
