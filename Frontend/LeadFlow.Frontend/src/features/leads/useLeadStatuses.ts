import { useQuery } from '@tanstack/react-query'
import { getLeadStatuses } from './leadStatusesService'

// Los estados del pipeline cambian poco, así que usamos una caché más larga (5 min).
export function useLeadStatuses() {
  const query = useQuery({
    queryKey: ['lead-statuses'],
    queryFn: getLeadStatuses,
    staleTime: 5 * 60_000,
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.isError ? 'No pudimos cargar el pipeline.' : null,
  }
}