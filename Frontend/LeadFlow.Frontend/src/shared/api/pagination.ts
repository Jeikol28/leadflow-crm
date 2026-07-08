// Forma estándar de las respuestas paginadas del backend.
export type PagedResponse<T> = {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}