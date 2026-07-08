import { useQuery } from '@tanstack/react-query'
import { getActiveAlerts } from './alertsService'

// Alertas comerciales activas (compartidas entre dashboard y campana del topbar).
export function useAlerts() {
  const query = useQuery({
    queryKey: ['alerts'],
    queryFn: getActiveAlerts,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.isError ? 'No pudimos cargar las alertas.' : null,
  }
}
