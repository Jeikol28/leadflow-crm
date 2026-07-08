import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary } from './dashboardService'

// Resumen del dashboard con caché, revalidación en foco y refresco manual.
export function useDashboardSummary() {
  const query = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? 'No pudimos cargar el resumen del dashboard.' : null,
    updatedAt: query.dataUpdatedAt,
  }
}
