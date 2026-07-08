// Subconjunto de AiContextResponse usado por la tarjeta del dashboard.
export type AiBusinessSummary = {
  totalCustomers: number
  activeLeads: number
  wonLeads: number
  lostLeads: number
  openPipelineAmount: number
  weightedPipelineAmount: number
  pendingTasks: number
  overdueTasks: number
  openQuotes: number
  openQuotesAmount: number
  conversionRate: number
}

export type AiContext = {
  companyName: string
  generatedAt: string
  businessSummary: AiBusinessSummary
  suggestedQuestions: string[]
}