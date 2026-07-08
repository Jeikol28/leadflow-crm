// Tipos del módulo Leads, alineados con LeadResponse / Create / Update.

export type Lead = {
  id: number
  companyId: number
  customerId: number
  customerName: string
  assignedUserId: number | null
  assignedUserName: string | null
  title: string
  description: string | null
  status: string
  priority: string
  estimatedAmount: number | null
  closeProbability: number
  score: number
  temperature: string
  isActive: boolean
  expectedCloseDate: string | null
  lastContactedAt: string | null
  createdAt: string
  updatedAt: string | null
}

// Cuerpo para crear/editar un lead.
export type LeadInput = {
  customerId: number
  assignedUserId?: number | null
  title: string
  description?: string | null
  status: string
  priority: string
  estimatedAmount?: number | null
  closeProbability: number
  expectedCloseDate?: string | null
}