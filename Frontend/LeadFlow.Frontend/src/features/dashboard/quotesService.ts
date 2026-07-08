import { httpClient } from '../../shared/api/httpClient'
import type { PagedResponse } from '../../shared/api/pagination'
import type { DashboardQuote } from './quotes.types'

// Trae las cotizaciones más recientes (primera página) para el dashboard.
export async function getRecentQuotes(pageSize = 5) {
  const response = await httpClient.get<PagedResponse<DashboardQuote>>('/quotes', {
    params: { Page: 1, PageSize: pageSize },
  })
  return response.data
}