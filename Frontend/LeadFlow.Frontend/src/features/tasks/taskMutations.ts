import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask, deleteTask, updateTask, updateTaskStatus } from './tasksService'
import type { Task, TaskInput } from './tasks.types'
import type { PagedResponse } from '../../shared/api/pagination'
import { useToast } from '../../shared/toast/useToast'

export function useCreateTask() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: (input: TaskInput) => createTask(input),
    onSuccess: () => {
      showToast('Tarea creada.', 'success')
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
    onError: () => showToast('No pudimos guardar la tarea.', 'error'),
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TaskInput }) => updateTask(id, input),
    onSuccess: () => {
      showToast('Tarea actualizada.', 'success')
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
    onError: () => showToast('No pudimos actualizar la tarea.', 'error'),
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateTaskStatus(id, status),
    // Actualización optimista: cambiamos el estado en el caché al instante.
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previous = queryClient.getQueriesData<PagedResponse<Task>>({ queryKey: ['tasks'] })
      queryClient.setQueriesData<PagedResponse<Task>>({ queryKey: ['tasks'] }, (old) =>
        old ? { ...old, items: old.items.map((t) => (t.id === id ? { ...t, status } : t)) } : old,
      )
      return { previous }
    },
    // Si falla, restauramos cada página cacheada a su valor previo.
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    // Al terminar (éxito o error), resincronizamos con el servidor.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      void queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}
