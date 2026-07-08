import { httpClient } from '../../shared/api/httpClient'
import type { PagedResponse } from '../../shared/api/pagination'
import type { AiChatLog, AiChatResponse } from './ai.types'

export async function sendAiChat(question: string) {
  const response = await httpClient.post<AiChatResponse>('/ai/chat', { question })
  return response.data
}

export async function getAiHistory(pageSize = 8) {
  const response = await httpClient.get<PagedResponse<AiChatLog>>('/ai/history', {
    params: { Page: 1, PageSize: pageSize },
  })
  return response.data
}
