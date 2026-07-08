import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createLead, deleteLead, updateLead, updateLeadStatus } from './leadsService'
import type { Lead, LeadInput } from './leads.types'
import type { PagedResponse } from '../../shared/api/pagination'
import { useToast } from '../../shared/toast/useToast'

export function useCreateLead() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: (input: LeadInput) => createLead(input),
    onSuccess: () => {
      showToast('Lead creado.', 'success')
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: () => showToast('No pudimos guardar el lead.', 'error'),
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: LeadInput }) => updateLead(id, input),
    onSuccess: () => {
      showToast('Lead actualizado.', 'success')
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: () => showToast('No pudimos actualizar el lead.', 'error'),
  })
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateLeadStatus(id, status),
    // Actualización optimista: la tarjeta se mueve de columna al instante.
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['leads'] })
      const previous = queryClient.getQueriesData<PagedResponse<Lead>>({ queryKey: ['leads'] })
      queryClient.setQueriesData<PagedResponse<Lead>>({ queryKey: ['leads'] }, (old) =>
        old ? { ...old, items: old.items.map((l) => (l.id === id ? { ...l, status } : l)) } : old,
      )
      return { previous }
    },
    // Si falla, devolvemos la tarjeta a su columna original y avisamos.
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      showToast('No pudimos mover el lead.', 'error')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

export function useDeleteLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteLead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}
