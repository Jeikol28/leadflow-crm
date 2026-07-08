import { httpClient } from '../../shared/api/httpClient'
import type { PagedResponse } from '../../shared/api/pagination'
import type { Interaction } from '../interactions/interactions.types'

// Línea de tiempo de interacciones de un lead (endpoint dedicado del backend).
export async function getLeadInteractions(leadId: number, pageSize = 50) {
  const response = await httpClient.get<PagedResponse<Interaction>>(`/interactions/lead/${leadId}`, {
    params: { Page: 1, PageSize: pageSize },
  })
  return response.data
}
