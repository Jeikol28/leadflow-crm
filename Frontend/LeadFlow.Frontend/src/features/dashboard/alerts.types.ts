// Tipos que reflejan la respuesta real de GET /api/alerts.

export type CrmAlert = {
  alertId: string
  type: string
  severity: string
  title: string
  message: string
  relatedEntityType: string
  relatedEntityId: number
  customerName: string | null
  assignedUserName: string | null
  dueDate: string | null
  amount: number | null
  suggestedAction: string
}

export type AlertSummary = {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  alerts: CrmAlert[]
}