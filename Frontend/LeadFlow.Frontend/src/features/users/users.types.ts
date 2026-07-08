export type User = {
  id: number
  companyId: number
  fullName: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export type CreateUserInput = {
  fullName: string
  email: string
  password: string
  role: string
}

export type UpdateUserInput = {
  fullName: string
  email: string
  role: string
  isActive: boolean
}
