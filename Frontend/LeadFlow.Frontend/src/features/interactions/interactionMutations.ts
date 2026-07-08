import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createInteraction, deleteInteraction, updateInteraction } from './interactionsService'
import type { CreateInteractionInput, UpdateInteractionInput } from './interactions.types'

export function useCreateInteraction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateInteractionInput) => createInteraction(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['interactions'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}

export function useUpdateInteraction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateInteractionInput }) =>
      updateInteraction(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['interactions'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}

export function useDeleteInteraction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteInteraction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['interactions'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}
