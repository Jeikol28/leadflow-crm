import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getUsers } from './usersService'

export function useUsers(page: number, pageSize: number) {
  const query = useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: () => getUsers(page, pageSize),
    placeholderData: keepPreviousData,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? 'No pudimos cargar los usuarios.' : null,
  }
}
