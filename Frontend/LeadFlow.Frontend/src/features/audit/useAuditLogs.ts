import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getAuditLogs } from './auditService'
import type { AuditFilters } from './audit.types'

export function useAuditLogs(filters: AuditFilters, page: number, pageSize: number) {
  const query = useQuery({
    queryKey: ['audit-logs', filters, page, pageSize],
    queryFn: () => getAuditLogs(filters, page, pageSize),
    placeholderData: keepPreviousData,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? 'No pudimos cargar la auditoría.' : null,
  }
}
