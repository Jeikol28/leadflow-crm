import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createService, deleteService, updateService } from './servicesService'
import type { ServiceInput } from './services.types'

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['services'] })
  void queryClient.invalidateQueries({ queryKey: ['service-options'] })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ServiceInput) => createService(input),
    onSuccess: () => invalidate(queryClient),
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ServiceInput }) => updateService(id, input),
    onSuccess: () => invalidate(queryClient),
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteService(id),
    onSuccess: () => invalidate(queryClient),
  })
}
