import { useQuery } from '@tanstack/react-query'
import { getSalesReport } from './reportsService'

// Reporte de ventas (solo Admin/Gerente). 'enabled' evita la llamada cuando no corresponde.
export function useSalesReport(enabled: boolean) {
  const query = useQuery({
    queryKey: ['sales-report'],
    queryFn: () => getSalesReport(),
    enabled,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.isError ? 'No pudimos cargar el reporte de ventas.' : null,
  }
}
