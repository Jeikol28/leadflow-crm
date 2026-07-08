import { useQuery } from '@tanstack/react-query'
import { getAiContext } from './aiService'

// Contexto comercial para la tarjeta del copiloto de IA.
export function useAiContext() {
  const query = useQuery({
    queryKey: ['ai-context'],
    queryFn: getAiContext,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.isError ? 'No pudimos cargar el asistente.' : null,
  }
}
