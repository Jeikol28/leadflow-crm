// Tipos del módulo Servicios (catálogo de productos/servicios de la empresa).

export type Service = {
  id: number
  companyId: number
  name: string
  description: string | null
  price: number
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export type ServiceInput = {
  name: string
  description?: string | null
  price: number
  isActive?: boolean
}
