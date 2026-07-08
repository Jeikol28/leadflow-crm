import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getServices } from './servicesService'

export function useServices(page: number, pageSize: number) {
  const query = useQuery({
    queryKey: ['services', page, pageSize],
    queryFn: () => getServices(page, pageSize),
    placeholderData: keepPreviousData,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? 'No pudimos cargar los servicios.' : null,
  }
}
