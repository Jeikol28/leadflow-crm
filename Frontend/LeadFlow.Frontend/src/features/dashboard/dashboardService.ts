import { httpClient } from '../../shared/api/httpClient'
import type { DashboardSummary } from './dashboard.types'

// Obtiene las métricas ejecutivas del CRM para la empresa autenticada.
export async function getDashboardSummary() {
  const response = await httpClient.get<DashboardSummary>('/dashboard/summary')
  return response.data
}