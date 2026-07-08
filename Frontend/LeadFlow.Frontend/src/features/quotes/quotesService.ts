import { httpClient } from '../../shared/api/httpClient'
import type { PagedResponse } from '../../shared/api/pagination'
import type { Quote, QuoteInput, SendQuoteEmailResult } from './quotes.types'

export async function getQuotes(page: number, pageSize: number) {
  const response = await httpClient.get<PagedResponse<Quote>>('/quotes', {
    params: { Page: page, PageSize: pageSize },
  })
  return response.data
}

export async function getQuote(id: number) {
  const response = await httpClient.get<Quote>(`/quotes/${id}`)
  return response.data
}

export async function createQuote(input: QuoteInput) {
  const response = await httpClient.post<Quote>('/quotes', input)
  return response.data
}

export async function updateQuote(id: number, input: QuoteInput) {
  const response = await httpClient.put<Quote>(`/quotes/${id}`, input)
  return response.data
}

export async function updateQuoteStatus(id: number, status: string) {
  const response = await httpClient.patch<Quote>(`/quotes/${id}/status`, { status })
  return response.data
}

export async function deleteQuote(id: number) {
  await httpClient.delete(`/quotes/${id}`)
}

export async function sendQuoteEmail(id: number) {
  const response = await httpClient.post<SendQuoteEmailResult>(`/quotes/${id}/send-email`)
  return response.data
}

// Descarga el PDF de la cotización como archivo en el navegador.
export async function downloadQuotePdf(id: number, quoteNumber: string) {
  const response = await httpClient.get(`/quotes/${id}/pdf`, { responseType: 'blob' })
  const blob = response.data as Blob
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${quoteNumber || 'cotizacion'}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
