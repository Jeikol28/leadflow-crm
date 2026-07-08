import { useQuery } from '@tanstack/react-query'
import { getCustomers } from '../customers/customersService'
import { getLeads } from '../leads/leadsService'
import { getServices } from '../services/servicesService'

export function useCustomerOptions() {
  const query = useQuery({
    queryKey: ['customer-options'],
    queryFn: () => getCustomers(1, 100),
    staleTime: 5 * 60_000,
  })
  return { options: query.data?.items ?? [], isLoading: query.isLoading }
}

export function useLeadOptions() {
  const query = useQuery({
    queryKey: ['lead-options'],
    queryFn: () => getLeads(1, 100),
    staleTime: 5 * 60_000,
  })
  return { options: query.data?.items ?? [], isLoading: query.isLoading }
}

export function useServiceOptions() {
  const query = useQuery({
    queryKey: ['service-options'],
    queryFn: () => getServices(1, 100),
    staleTime: 5 * 60_000,
  })
  return { options: query.data?.items ?? [], isLoading: query.isLoading }
}
