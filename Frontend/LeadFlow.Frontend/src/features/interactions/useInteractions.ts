import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getInteractions } from './interactionsService'

export function useInteractions(page: number, pageSize: number) {
  const query = useQuery({
    queryKey: ['interactions', page, pageSize],
    queryFn: () => getInteractions(page, pageSize),
    placeholderData: keepPreviousData,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? 'No pudimos cargar las interacciones.' : null,
  }
}
