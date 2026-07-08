import { httpClient } from '../../shared/api/httpClient'
import type { PagedResponse } from '../../shared/api/pagination'
import type { CreateUserInput, UpdateUserInput, User } from './users.types'

export async function getUsers(page: number, pageSize: number) {
  const response = await httpClient.get<PagedResponse<User>>('/users', {
    params: { Page: page, PageSize: pageSize },
  })
  return response.data
}

export async function createUser(input: CreateUserInput) {
  const response = await httpClient.post<User>('/users', input)
  return response.data
}

export async function updateUser(id: number, input: UpdateUserInput) {
  const response = await httpClient.put<User>(`/users/${id}`, input)
  return response.data
}

export async function updateUserStatus(id: number, isActive: boolean) {
  const response = await httpClient.patch<User>(`/users/${id}/status`, { isActive })
  return response.data
}
