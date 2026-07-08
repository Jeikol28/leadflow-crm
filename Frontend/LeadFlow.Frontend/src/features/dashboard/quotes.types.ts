// Subconjunto de QuoteResponse usado en la tabla del dashboard.
export type DashboardQuote = {
  id: number
  quoteNumber: string
  customerName: string
  status: string
  currency: string
  total: number
  issueDate: string
}