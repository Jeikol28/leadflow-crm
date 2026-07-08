// Tipos de presentación del dashboard (tarjetas de KPI y pipeline).
// Los datos vienen del backend; estos tipos describen la forma que esperan los componentes.

export type MetricId = 'revenue' | 'leads' | 'conversion' | 'quotes' | 'tasks' | 'pipeline'
export type TrendDirection = 'up' | 'down' | 'neutral'

export type Metric = {
  id: MetricId
  label: string
  value: string
  trend: TrendDirection
  trendValue: string
  hint: string
}

export type PipelineStage = {
  name: string
  count: number
  value: string
  amount: number
  barColor: string
  dotColor: string
}

// Tipos que reflejan la respuesta real de GET /api/dashboard/summary.

export type DashboardGroup = {
  name: string
  count: number
  amount: number
}

export type DashboardTask = {
  id: number
  title: string
  status: string
  priority: string
  dueDate: string | null
  isOverdue: boolean
  customerName: string | null
  leadTitle: string | null
  assignedUserName: string
}

export type DashboardLead = {
  id: number
  title: string
  customerName: string
  status: string
  priority: string
  estimatedAmount: number | null
  closeProbability: number
  score: number
  temperature: string
  expectedCloseDate: string | null
}

export type DashboardInteraction = {
  id: number
  type: string
  description: string
  interactionDate: string
  customerName: string | null
  leadTitle: string | null
  userFullName: string
}

export type DashboardSummary = {
  totalCustomers: number
  activeLeads: number
  wonLeads: number
  lostLeads: number
  openPipelineAmount: number
  weightedPipelineAmount: number
  acceptedQuotesAmount: number
  currentMonthAcceptedQuotesAmount: number
  pendingTasks: number
  overdueTasks: number
  completedTasks: number
  quotesDraft: number
  quotesSent: number
  quotesAccepted: number
  conversionRate: number
  leadsByStatus: DashboardGroup[]
  leadsByTemperature: DashboardGroup[]
  quotesByStatus: DashboardGroup[]
  upcomingTasks: DashboardTask[]
  topOpenLeads: DashboardLead[]
  recentInteractions: DashboardInteraction[]
}