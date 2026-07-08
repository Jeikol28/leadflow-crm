import { useQuery } from '@tanstack/react-query'
import { getCustomers } from '../customers/customersService'
import { getLeads } from '../leads/leadsService'

// Clientes para el selector (comparte caché con otros módulos que usan la misma key).
export function useCustomerOptions() {
  const query = useQuery({
    queryKey: ['customer-options'],
    queryFn: () => getCustomers(1, 100),
    staleTime: 5 * 60_000,
  })
  return { options: query.data?.items ?? [], isLoading: query.isLoading }
}

// Leads para el selector.
export function useLeadOptions() {
  const query = useQuery({
    queryKey: ['lead-options'],
    queryFn: () => getLeads(1, 100),
    staleTime: 5 * 60_000,
  })
  return { options: query.data?.items ?? [], isLoading: query.isLoading }
}