import { useQuery } from '@tanstack/react-query'
import { getRecentQuotes } from './quotesService'

// Cotizaciones recientes para la tabla del dashboard.
export function useRecentQuotes() {
  const query = useQuery({
    queryKey: ['recent-quotes'],
    queryFn: () => getRecentQuotes(),
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.isError ? 'No pudimos cargar las cotizaciones.' : null,
  }
}
