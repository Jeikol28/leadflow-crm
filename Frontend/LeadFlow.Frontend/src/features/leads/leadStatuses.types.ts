// Estado del pipeline (una columna del kanban).
export type LeadStatus = {
  id: number
  companyId: number
  name: string
  description: string | null
  color: string | null
  sortOrder: number
  isWon: boolean
  isLost: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}