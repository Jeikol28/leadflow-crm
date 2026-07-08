import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTaskStatus } from './tasksService'

// Marca una tarea como completada y refresca el dashboard y las alertas.
export function useCompleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: number) => updateTaskStatus(taskId, 'Completada'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      void queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}
