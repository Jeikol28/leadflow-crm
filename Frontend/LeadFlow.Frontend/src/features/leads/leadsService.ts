import { httpClient } from '../../shared/api/httpClient'
import type { PagedResponse } from '../../shared/api/pagination'
import type { Lead, LeadInput } from './leads.types'

export async function getLeads(page: number, pageSize: number) {
  const response = await httpClient.get<PagedResponse<Lead>>('/leads', {
    params: { Page: page, PageSize: pageSize },
  })
  return response.data
}

export async function getLead(id: number) {
  const response = await httpClient.get<Lead>(`/leads/${id}`)
  return response.data
}

export async function createLead(input: LeadInput) {
  const response = await httpClient.post<Lead>('/leads', input)
  return response.data
}

export async function updateLead(id: number, input: LeadInput) {
  const response = await httpClient.put<Lead>(`/leads/${id}`, input)
  return response.data
}

// Cambia solo el estado del lead (lo usaremos en el kanban al mover una tarjeta).
export async function updateLeadStatus(id: number, status: string) {
  const response = await httpClient.patch<Lead>(`/leads/${id}/status`, { status })
  return response.data
}

export async function deleteLead(id: number) {
  await httpClient.delete(`/leads/${id}`)
}