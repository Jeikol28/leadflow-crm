import { useQuery } from '@tanstack/react-query'
import { getCustomers } from '../customers/customersService'

// Trae hasta 100 clientes para poblar el selector del formulario de leads.
export function useCustomerOptions() {
  const query = useQuery({
    queryKey: ['customer-options'],
    queryFn: () => getCustomers(1, 100),
    staleTime: 5 * 60_000,
  })

  return {
    options: query.data?.items ?? [],
    isLoading: query.isLoading,
  }
}