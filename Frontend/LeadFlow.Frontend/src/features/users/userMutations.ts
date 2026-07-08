import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createUser, updateUser, updateUserStatus } from './usersService'
import type { CreateUserInput, UpdateUserInput } from './users.types'

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateUserInput }) => updateUser(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => updateUserStatus(id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
