import { httpClient } from '../../shared/api/httpClient'
import type { AlertSummary } from './alerts.types'

// Obtiene las alertas comerciales calculadas en tiempo real para la empresa.
export async function getActiveAlerts() {
  const response = await httpClient.get<AlertSummary>('/alerts')
  return response.data
}