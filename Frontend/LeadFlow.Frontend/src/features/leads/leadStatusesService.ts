import { httpClient } from '../../shared/api/httpClient'
import type { LeadStatus } from './leadStatuses.types'

// El backend devuelve una lista simple (no paginada) de estados del pipeline.
export async function getLeadStatuses() {
  const response = await httpClient.get<LeadStatus[]>('/lead-statuses')
  return response.data
}