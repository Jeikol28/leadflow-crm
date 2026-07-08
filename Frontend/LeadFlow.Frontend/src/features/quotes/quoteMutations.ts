import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createQuote,
  deleteQuote,
  sendQuoteEmail,
  updateQuote,
  updateQuoteStatus,
} from './quotesService'
import type { QuoteInput } from './quotes.types'

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['quotes'] })
  void queryClient.invalidateQueries({ queryKey: ['recent-quotes'] })
  void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
}

export function useCreateQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: QuoteInput) => createQuote(input),
    onSuccess: () => invalidate(queryClient),
  })
}

export function useUpdateQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: QuoteInput }) => updateQuote(id, input),
    onSuccess: () => invalidate(queryClient),
  })
}

export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateQuoteStatus(id, status),
    onSuccess: () => invalidate(queryClient),
  })
}

export function useDeleteQuote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteQuote(id),
    onSuccess: () => invalidate(queryClient),
  })
}

export function useSendQuoteEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => sendQuoteEmail(id),
    onSuccess: () => invalidate(queryClient),
  })
}
