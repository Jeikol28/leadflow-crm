import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getQuotes } from './quotesService'

export function useQuotes(page: number, pageSize: number) {
  const query = useQuery({
    queryKey: ['quotes', page, pageSize],
    queryFn: () => getQuotes(page, pageSize),
    placeholderData: keepPreviousData,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? 'No pudimos cargar las cotizaciones.' : null,
  }
}
