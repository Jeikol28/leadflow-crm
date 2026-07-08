import { httpClient } from '../../shared/api/httpClient'
import type {
  CustomerReport,
  PipelineReport,
  ProductivityReport,
  SalesReport,
} from './reports.types'

export async function getSalesReport(from: string, to: string) {
  const response = await httpClient.get<SalesReport>('/reports/sales', { params: { from, to } })
  return response.data
}

// El reporte de pipeline es una foto actual, no usa rango de fechas.
export async function getPipelineReport() {
  const response = await httpClient.get<PipelineReport>('/reports/pipeline')
  return response.data
}

export async function getProductivityReport(from: string, to: string) {
  const response = await httpClient.get<ProductivityReport>('/reports/productivity', {
    params: { from, to },
  })
  return response.data
}

export async function getCustomerReport(from: string, to: string) {
  const response = await httpClient.get<CustomerReport>('/reports/customers', { params: { from, to } })
  return response.data
}
