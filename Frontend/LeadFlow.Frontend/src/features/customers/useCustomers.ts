import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getCustomers } from './customersService'

// Lista de clientes paginada. keepPreviousData evita parpadeos al cambiar de página.
export function useCustomers(page: number, pageSize: number) {
  const query = useQuery({
    queryKey: ['customers', page, pageSize],
    queryFn: () => getCustomers(page, pageSize),
    placeholderData: keepPreviousData,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? 'No pudimos cargar los clientes.' : null,
  }
}