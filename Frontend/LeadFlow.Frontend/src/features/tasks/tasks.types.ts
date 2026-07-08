export type Task = {
  id: number
  companyId: number
  customerId: number | null
  customerName: string | null
  leadId: number | null
  leadTitle: string | null
  assignedUserId: number
  assignedUserName: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  completedAt: string | null
  isOverdue: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export type TaskInput = {
  customerId?: number | null
  leadId?: number | null
  assignedUserId: number
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: string | null
}