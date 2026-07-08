import { httpClient } from '../../shared/api/httpClient'
import type { SalesReport } from './reports.types'

// Reporte de ventas (solo Admin/Gerente). Sin fechas, el backend usa su rango por defecto.
export async function getSalesReport(from?: string, to?: string) {
  const response = await httpClient.get<SalesReport>('/reports/sales', {
    params: { from, to },
  })
  return response.data
}