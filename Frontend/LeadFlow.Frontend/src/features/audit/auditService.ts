import { httpClient } from '../../shared/api/httpClient'
import type { PagedResponse } from '../../shared/api/pagination'
import type { AuditFilters, AuditLog } from './audit.types'

export async function getAuditLogs(filters: AuditFilters, page: number, pageSize: number) {
  const params: Record<string, string | number> = { Page: page, PageSize: pageSize }
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  if (filters.entityName) params.entityName = filters.entityName
  if (filters.action) params.action = filters.action

  const response = await httpClient.get<PagedResponse<AuditLog>>('/audit-logs', { params })
  return response.data
}
