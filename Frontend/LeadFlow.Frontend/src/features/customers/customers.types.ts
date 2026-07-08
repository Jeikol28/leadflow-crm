// Tipos del módulo Clientes, alineados con los DTOs del backend.

export type Customer = {
  id: number
  companyId: number
  name: string
  email: string | null
  phone: string | null
  province: string | null
  canton: string | null
  address: string | null
  source: string | null
  status: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

// Mismo cuerpo para crear y editar (CreateCustomerRequest / UpdateCustomerRequest).
export type CustomerInput = {
  name: string
  email?: string | null
  phone?: string | null
  province?: string | null
  canton?: string | null
  address?: string | null
  source?: string | null
  status: string
}