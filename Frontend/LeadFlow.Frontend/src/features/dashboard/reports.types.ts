// Subconjunto de SalesReportResponse usado por el dashboard.
export type SalesByMonth = {
  year: number
  month: number
  quotesCount: number
  quotedAmount: number
  acceptedAmount: number
}

export type SalesReport = {
  from: string | null
  to: string | null
  totalQuotes: number
  acceptedQuotes: number
  totalQuotedAmount: number
  acceptedAmount: number
  acceptanceRate: number
  salesByMonth: SalesByMonth[]
}