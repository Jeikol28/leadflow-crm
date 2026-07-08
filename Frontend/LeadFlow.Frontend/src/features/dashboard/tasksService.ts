import { httpClient } from '../../shared/api/httpClient'

// Cambia el estado de una tarea (por ejemplo, marcarla como "Completada").
export async function updateTaskStatus(taskId: number, status: string) {
  const response = await httpClient.patch(`/tasks/${taskId}/status`, { status })
  return response.data
}
