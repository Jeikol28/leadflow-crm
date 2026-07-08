import { httpClient } from '../../shared/api/httpClient'
import type { AiContext } from './ai.types'

// Obtiene el contexto comercial seguro que alimenta al asistente de IA.
export async function getAiContext() {
  const response = await httpClient.get<AiContext>('/ai/context')
  return response.data
}