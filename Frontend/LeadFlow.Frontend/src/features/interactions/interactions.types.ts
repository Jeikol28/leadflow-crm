// Tipos del módulo Interacciones, alineados con InteractionResponse / Create / Update.

export type Interaction = {
  id: number
  companyId: number
  customerId: number | null
  customerName: string | null
  leadId: number | null
  leadTitle: string | null
  userId: number
  userFullName: string
  type: string
  description: string
  interactionDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

// Al crear se puede vincular a un cliente y/o lead.
export type CreateInteractionInput = {
  customerId?: number | null
  leadId?: number | null
  type: string
  description: string
  interactionDate?: string | null
}

// Al editar el backend solo permite cambiar tipo, descripción y fecha.
export type UpdateInteractionInput = {
  type: string
  description: string
  interactionDate?: string | null
}
