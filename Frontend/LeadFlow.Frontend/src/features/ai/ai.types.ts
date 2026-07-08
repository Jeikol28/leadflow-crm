// Tipos del asistente de IA (chat comercial simulado por el backend).

export type AiChatResponse = {
  answer: string
  recommendations: string[]
  relatedEntities: string[]
  isSimulated: boolean
  generatedAt: string
}

export type AiChatLog = {
  id: number
  question: string
  answer: string
  recommendations: string[]
  relatedEntities: string[]
  isSimulated: boolean
  createdAt: string
}

// Mensaje en la conversación de la interfaz.
export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  recommendations?: string[]
  relatedEntities?: string[]
}
