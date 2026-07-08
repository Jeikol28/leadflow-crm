export type AuditLog = {
  id: number
  companyId: number
  userId: number | null
  userEmail: string | null
  userRole: string | null
  action: string
  entityName: string
  entityId: number | null
  description: string
  createdAt: string
}

export type AuditFilters = {
  from: string
  to: string
  entityName: string
  action: string
}
