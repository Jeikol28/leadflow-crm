import { httpClient } from '../../shared/api/httpClient'
import type { PagedResponse } from '../../shared/api/pagination'
import type { Task, TaskInput } from './tasks.types'

export async function getTasks(page: number, pageSize: number) {
  const response = await httpClient.get<PagedResponse<Task>>('/tasks', {
    params: { Page: page, PageSize: pageSize },
  })
  return response.data
}

export async function getTask(id: number) {
  const response = await httpClient.get<Task>(`/tasks/${id}`)
  return response.data
}

export async function createTask(input: TaskInput) {
  const response = await httpClient.post<Task>('/tasks', input)
  return response.data
}

export async function updateTask(id: number, input: TaskInput) {
  const response = await httpClient.put<Task>(`/tasks/${id}`, input)
  return response.data
}

// Cambia solo el estado (lo usamos para completar/cancelar desde la tabla).
export async function updateTaskStatus(id: number, status: string) {
  const response = await httpClient.patch<Task>(`/tasks/${id}/status`, { status })
  return response.data
}

export async function deleteTask(id: number) {
  await httpClient.delete(`/tasks/${id}`)
}