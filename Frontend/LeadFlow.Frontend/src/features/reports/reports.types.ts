// Tipos de los cuatro reportes gerenciales (solo Admin/Gerente).

export type ReportGroup = {
  name: string
  count: number
  amount: number
}

export type SalesByMonth = {
  year: number
  month: number
  quotesCount: number
  quotedAmount: number
  acceptedAmount: number
}

export type TopQuote = {
  id: number
  quoteNumber: string
  customerName: string
  createdByUserName: string
  status: string
  total: number
  issueDate: string
  acceptedAt: string | null
}

export type SalesReport = {
  from: string | null
  to: string | null
  totalQuotes: number
  draftQuotes: number
  sentQuotes: number
  acceptedQuotes: number
  rejectedQuotes: number
  totalQuotedAmount: number
  acceptedAmount: number
  rejectedAmount: number
  averageQuoteAmount: number
  acceptanceRate: number
  discountsGivenAmount: number
  taxCollectedAmount: number
  salesByMonth: SalesByMonth[]
  quotesByStatus: ReportGroup[]
  topAcceptedQuotes: TopQuote[]
}

export type PipelineLead = {
  id: number
  title: string
  customerName: string
  assignedUserName: string | null
  status: string
  priority: string
  estimatedAmount: number | null
  closeProbability: number
  score: number
  temperature: string
  expectedCloseDate: string | null
}

export type PipelineReport = {
  totalLeads: number
  openLeads: number
  wonLeads: number
  lostLeads: number
  openPipelineAmount: number
  weightedPipelineAmount: number
  averageCloseProbability: number
  averageScore: number
  winRate: number
  leadsByStatus: ReportGroup[]
  leadsByPriority: ReportGroup[]
  leadsByTemperature: ReportGroup[]
  upcomingCloseLeads: PipelineLead[]
}

export type UserProductivity = {
  userId: number
  fullName: string
  email: string
  role: string
  assignedLeads: number
  wonLeads: number
  pendingTasks: number
  completedTasks: number
  overdueTasks: number
  interactions: number
  quotesCreated: number
  acceptedQuotes: number
  acceptedAmount: number
}

export type ProductivityReport = {
  from: string | null
  to: string | null
  activeUsers: number
  totalInteractions: number
  totalCompletedTasks: number
  totalOverdueTasks: number
  users: UserProductivity[]
}

export type CustomerValue = {
  customerId: number
  customerName: string
  leadsCount: number
  openLeadsCount: number
  quotesCount: number
  acceptedQuotesCount: number
  potentialAmount: number
  acceptedAmount: number
  createdAt: string
}

export type CustomerReport = {
  from: string | null
  to: string | null
  totalCustomers: number
  newCustomers: number
  customersWithOpenLeads: number
  customersWithAcceptedQuotes: number
  customersBySource: ReportGroup[]
  customersByProvince: ReportGroup[]
  topCustomers: CustomerValue[]
}
