import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCustomer, deleteCustomer, updateCustomer } from './customersService'
import type { CustomerInput } from './customers.types'

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CustomerInput) => createCustomer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CustomerInput }) => updateCustomer(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCustomer(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}