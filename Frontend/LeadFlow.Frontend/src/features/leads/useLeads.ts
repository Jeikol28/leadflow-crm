import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getLeads } from './leadsService'

export function useLeads(page: number, pageSize: number) {
  const query = useQuery({
    queryKey: ['leads', page, pageSize],
    queryFn: () => getLeads(page, pageSize),
    placeholderData: keepPreviousData,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? 'No pudimos cargar los leads.' : null,
  }
}