import type { ReactNode } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useLeadDetail, useLeadInteractions, useLeadQuotes, useLeadTasks } from './useLeadDetail'
import { formatCurrency, formatShortDate } from '../../shared/utils/format'

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-black text-slate-600">
      {children}
    </span>
  )
}

function TimelineCard({
  title,
  count,
  empty,
  children,
}: {
  title: string
  count: number
  empty: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-teal-950">{title}</h2>
        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-black text-teal-700">{count}</span>
      </div>
      {count === 0 ? (
        <p className="mt-4 text-sm text-slate-400">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100" role="list">
          {children}
        </ul>
      )}
    </section>
  )
}

export function LeadDetailPage() {
  const params = useParams({ strict: false })
  const id = Number(params.leadId)

  const { lead, isLoading, error } = useLeadDetail(id)
  const { items: tasks } = useLeadTasks(id)
  const { items: interactions } = useLeadInteractions(id)
  const { items: quotes } = useLeadQuotes(id)

  if (isLoading) {
    return <p className="py-16 text-center text-sm text-slate-400">Cargando lead…</p>
  }

  if (error || !lead) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-semibold text-rose-600">{error ?? 'Lead no encontrado.'}</p>
        <Link to="/app/leads" className="mt-3 inline-block text-sm font-black text-teal-700 hover:text-teal-900">
          Volver a leads
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <Link to="/app/leads" className="text-xs font-black text-teal-600 hover:text-teal-800">
          ← Volver a leads
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-teal-950">{lead.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {lead.customerName}
          {lead.assignedUserName ? ` · ${lead.assignedUserName}` : ''}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{lead.status}</Badge>
          <Badge>{lead.priority}</Badge>
          {lead.temperature && <Badge>{lead.temperature}</Badge>}
          {lead.estimatedAmount != null && <Badge>{formatCurrency(lead.estimatedAmount)}</Badge>}
          <Badge>Prob. {lead.closeProbability}%</Badge>
          <Badge>Score {lead.score}</Badge>
        </div>
        {lead.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{lead.description}</p>}
      </div>

      {/* Línea de tiempo */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TimelineCard title="Tareas" count={tasks.length} empty="Sin tareas para este lead.">
          {tasks.map((task) => (
            <li key={task.id} className="py-2.5">
              <p className="text-sm font-semibold text-slate-800">{task.title}</p>
              <p className="text-xs text-slate-400">
                {task.status} · vence {formatShortDate(task.dueDate)}
              </p>
            </li>
          ))}
        </TimelineCard>

        <TimelineCard title="Interacciones" count={interactions.length} empty="Sin interacciones registradas.">
          {interactions.map((interaction) => (
            <li key={interaction.id} className="py-2.5">
              <p className="text-sm font-semibold text-slate-800">{interaction.type}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">{interaction.description}</p>
              <p className="text-[11px] text-slate-400">
                {formatShortDate(interaction.interactionDate)} · {interaction.userFullName}
              </p>
            </li>
          ))}
        </TimelineCard>

        <TimelineCard title="Cotizaciones" count={quotes.length} empty="Sin cotizaciones.">
          {quotes.map((quote) => (
            <li key={quote.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="font-mono text-xs font-bold text-teal-700">{quote.quoteNumber}</p>
                <p className="text-[11px] text-slate-400">{quote.status}</p>
              </div>
              <span className="text-sm font-black text-slate-900">{formatCurrency(quote.total)}</span>
            </li>
          ))}
        </TimelineCard>
      </div>
    </div>
  )
}
