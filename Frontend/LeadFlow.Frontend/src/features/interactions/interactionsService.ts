import { httpClient } from '../../shared/api/httpClient'
import type { PagedResponse } from '../../shared/api/pagination'
import type {
  CreateInteractionInput,
  Interaction,
  UpdateInteractionInput,
} from './interactions.types'

export async function getInteractions(page: number, pageSize: number) {
  const response = await httpClient.get<PagedResponse<Interaction>>('/interactions', {
    params: { Page: page, PageSize: pageSize },
  })
  return response.data
}

export async function createInteraction(input: CreateInteractionInput) {
  const response = await httpClient.post<Interaction>('/interactions', input)
  return response.data
}

export async function updateInteraction(id: number, input: UpdateInteractionInput) {
  const response = await httpClient.put<Interaction>(`/interactions/${id}`, input)
  return response.data
}

export async function deleteInteraction(id: number) {
  await httpClient.delete(`/interactions/${id}`)
}
