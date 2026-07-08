import { ArrowRight, Bot, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { useAiContext } from '../useAiContext'
import type { AiBusinessSummary } from '../ai.types'

function formatCRC(value: number): string {
  if (value >= 1_000_000) return `CRC ${(value / 1_000_000).toFixed(1)}M`
  return `CRC ${(value / 1_000).toFixed(0)}K`
}

// Construye una recomendación a partir del resumen comercial real del backend.
function buildInsight(summary: AiBusinessSummary): string {
  const leads = `${summary.activeLeads} lead${summary.activeLeads === 1 ? '' : 's'} activo${summary.activeLeads === 1 ? '' : 's'}`
  const quotes = `${summary.openQuotes} cotización${summary.openQuotes === 1 ? '' : 'es'} abierta${summary.openQuotes === 1 ? '' : 's'} por ${formatCRC(summary.openQuotesAmount)}`
  const tasks =
    summary.overdueTasks > 0
      ? `${summary.overdueTasks} tarea${summary.overdueTasks === 1 ? '' : 's'} vencida${summary.overdueTasks === 1 ? '' : 's'} requiere${summary.overdueTasks === 1 ? '' : 'n'} atención.`
      : 'No tienes tareas vencidas.'
  return `Tienes ${leads} y ${quotes}. ${tasks}`
}

export function AIInsightCard() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useAiContext()

  return (
    <section className="flex flex-col rounded-2xl border border-teal-950/10 bg-teal-950 p-6 text-white shadow-[0_8px_32px_rgba(4,47,46,0.2)]">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <motion.span
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(20,184,166,0)',
              '0 0 0 6px rgba(20,184,166,0.2)',
              '0 0 0 0 rgba(20,184,166,0)',
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="grid size-9 place-items-center rounded-xl bg-white/10 text-cyan-300"
          aria-hidden
        >
          <Bot size={18} />
        </motion.span>
        <div>
          <p className="text-[13px] font-black text-white">Copiloto IA</p>
          <p className="text-[11px] text-teal-100/60">Resumen de hoy</p>
        </div>
        <span className="ml-auto flex items-center gap-1 rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[10px] font-black text-cyan-100">
          <Sparkles size={10} aria-hidden />
          IA
        </span>
      </div>

      {/* Insight */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/8 p-4">
        {isLoading && (
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-white/15" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-white/15" />
          </div>
        )}
        {error && <p className="text-sm text-teal-50/80">{error}</p>}
        {data && <p className="text-sm leading-7 text-teal-50/90">{buildInsight(data.businessSummary)}</p>}
      </div>

      {/* Contexto */}
      {data && (
        <p className="mt-3 text-[11px] font-semibold text-teal-100/55">
          Conversión {Math.round(data.businessSummary.conversionRate)}% · Pipeline{' '}
          {formatCRC(data.businessSummary.openPipelineAmount)}
        </p>
      )}

      {/* CTA */}
      <motion.button
        onClick={() => navigate({ to: '/app/ai' })}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="group mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-black text-teal-950 transition-colors hover:bg-cyan-50"
      >
        Abrir asistente IA
        <ArrowRight
          size={14}
          className="transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden
        />
      </motion.button>
    </section>
  )
}