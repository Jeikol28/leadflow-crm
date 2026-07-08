import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Bot, Sparkles } from 'lucide-react'
import { getAiHistory, sendAiChat } from './aiChatService'
import { getAiContext } from '../dashboard/aiService'
import type { ChatMessage } from './ai.types'

let counter = 0
function nextId() {
  counter += 1
  return `m${counter}`
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-teal-950 px-4 py-2.5 text-sm text-white">
          {message.text}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
        <p className="leading-6">{message.text}</p>

        {message.recommendations && message.recommendations.length > 0 && (
          <ul className="mt-2 space-y-1">
            {message.recommendations.map((rec, index) => (
              <li key={index} className="flex gap-2 text-xs text-slate-600">
                <span className="text-teal-600">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        )}

        {message.relatedEntities && message.relatedEntities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.relatedEntities.map((entity, index) => (
              <span key={index} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">
                {entity}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const { data: context } = useQuery({ queryKey: ['ai-context'], queryFn: getAiContext })
  const suggestions = (context?.suggestedQuestions ?? []).slice(0, 4)

  // Carga el historial reciente para dar continuidad a la conversación.
  const { data: history } = useQuery({ queryKey: ['ai-history'], queryFn: () => getAiHistory(8) })
  useEffect(() => {
    if (!history) return
    const seeded: ChatMessage[] = []
    ;[...history.items].reverse().forEach((log) => {
      seeded.push({ id: nextId(), role: 'user', text: log.question })
      seeded.push({
        id: nextId(),
        role: 'assistant',
        text: log.answer,
        recommendations: log.recommendations,
        relatedEntities: log.relatedEntities,
      })
    })
    setMessages((current) => (current.length === 0 ? seeded : current))
  }, [history])

  const chat = useMutation({
    mutationFn: sendAiChat,
    onSuccess: (result) => {
      setMessages((current) => [
        ...current,
        {
          id: nextId(),
          role: 'assistant',
          text: result.answer,
          recommendations: result.recommendations,
          relatedEntities: result.relatedEntities,
        },
      ])
    },
    onError: () => {
      setMessages((current) => [
        ...current,
        { id: nextId(), role: 'assistant', text: 'No pude responder en este momento. Intenta de nuevo.' },
      ])
    },
  })

  // Auto-scroll al último mensaje.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, chat.isPending])

  function ask(question: string) {
    const trimmed = question.trim()
    if (!trimmed || chat.isPending) return
    setMessages((current) => [...current, { id: nextId(), role: 'user', text: trimmed }])
    setInput('')
    chat.mutate(trimmed)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    ask(input)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-950 text-cyan-300">
          <Bot size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-teal-950">Asistente IA</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Copiloto comercial basado en los datos de tu empresa.
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-black text-teal-700">
              <Sparkles size={9} /> IA · Groq
            </span>
          </p>
        </div>
      </div>

      {/* Chat */}
      <section className="flex h-[60vh] flex-col rounded-2xl border border-slate-200/70 bg-slate-50/40 shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="text-sm font-semibold text-slate-500">Pregúntame sobre tus oportunidades, tareas o cotizaciones.</p>
                <p className="mt-1 text-xs text-slate-400">Por ejemplo, elige una sugerencia de abajo.</p>
              </div>
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}

          {chat.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-400 shadow-sm">
                Pensando…
              </div>
            </div>
          )}
        </div>

        {/* Sugerencias */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-slate-200/70 px-4 py-3">
            {suggestions.map((question) => (
              <button
                key={question}
                onClick={() => ask(question)}
                disabled={chat.isPending}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-300 hover:text-teal-800 disabled:opacity-60"
              >
                {question}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-slate-200/70 p-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Escribe tu pregunta…"
            className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition-colors focus:border-teal-500"
            aria-label="Pregunta para el asistente"
          />
          <button
            type="submit"
            disabled={chat.isPending || input.trim() === ''}
            className="h-11 rounded-xl bg-teal-950 px-5 text-sm font-black text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            Enviar
          </button>
        </form>
      </section>
    </div>
  )
}
