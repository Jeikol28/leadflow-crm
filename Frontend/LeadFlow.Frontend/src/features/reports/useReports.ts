import { useQuery } from '@tanstack/react-query'
import {
  getCustomerReport,
  getPipelineReport,
  getProductivityReport,
  getSalesReport,
} from './reportsService'

// Cada reporte solo se consulta cuando su pestaña está activa (enabled).
export function useSalesReport(from: string, to: string, enabled: boolean) {
  const query = useQuery({
    queryKey: ['report-sales', from, to],
    queryFn: () => getSalesReport(from, to),
    enabled,
  })
  return { data: query.data ?? null, isLoading: query.isLoading, error: query.isError ? 'No pudimos cargar el reporte.' : null }
}

export function usePipelineReport(enabled: boolean) {
  const query = useQuery({
    queryKey: ['report-pipeline'],
    queryFn: getPipelineReport,
    enabled,
  })
  return { data: query.data ?? null, isLoading: query.isLoading, error: query.isError ? 'No pudimos cargar el reporte.' : null }
}

export function useProductivityReport(from: string, to: string, enabled: boolean) {
  const query = useQuery({
    queryKey: ['report-productivity', from, to],
    queryFn: () => getProductivityReport(from, to),
    enabled,
  })
  return { data: query.data ?? null, isLoading: query.isLoading, error: query.isError ? 'No pudimos cargar el reporte.' : null }
}

export function useCustomerReport(from: string, to: string, enabled: boolean) {
  const query = useQuery({
    queryKey: ['report-customers', from, to],
    queryFn: () => getCustomerReport(from, to),
    enabled,
  })
  return { data: query.data ?? null, isLoading: query.isLoading, error: query.isError ? 'No pudimos cargar el reporte.' : null }
}
