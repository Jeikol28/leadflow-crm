import { useState } from 'react'
import { useLeads } from './useLeads'
import { useLeadStatuses } from './useLeadStatuses'
import { useUpdateLeadStatus } from './leadMutations'
import { formatCurrency } from '../../shared/utils/format'
import type { Lead } from './leads.types'

// El tablero carga más leads (hasta 100) para mostrarlos todos en columnas.
export function LeadsBoard({ onEdit }: { onEdit: (lead: Lead) => void }) {
  const { data: leadsPage, isLoading: loadingLeads } = useLeads(1, 100)
  const { data: statuses, isLoading: loadingStatuses } = useLeadStatuses()
  const updateStatus = useUpdateLeadStatus()
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)

  const leads = leadsPage?.items ?? []
  const columns = statuses.filter((status) => status.isActive).sort((a, b) => a.sortOrder - b.sortOrder)

  function handleDrop(statusName: string, leadId: number) {
    setDragOverStatus(null)
    const lead = leads.find((item) => item.id === leadId)
    if (!lead || lead.status === statusName) return
    updateStatus.mutate({ id: leadId, status: statusName })
  }

  if (loadingLeads || loadingStatuses) {
    return <p className="py-16 text-center text-sm text-slate-400">Cargando pipeline…</p>
  }

  if (columns.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-500">No hay estados de pipeline configurados.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {columns.map((column) => {
        const columnLeads = leads.filter((lead) => lead.status === column.name)
        const total = columnLeads.reduce((sum, lead) => sum + (lead.estimatedAmount ?? 0), 0)
        const isOver = dragOverStatus === column.name

        return (
          <div
            key={column.id}
            onDragOver={(event) => {
              event.preventDefault()
              setDragOverStatus(column.name)
            }}
            onDragLeave={() => setDragOverStatus((current) => (current === column.name ? null : current))}
            onDrop={(event) => {
              const id = Number(event.dataTransfer.getData('text/plain'))
              if (id) handleDrop(column.name, id)
            }}
            className={`flex flex-col rounded-2xl border p-3 transition-colors ${
              isOver ? 'border-teal-400 bg-teal-50/60' : 'border-slate-200/70 bg-slate-50/60'
            }`}
          >
            {/* Encabezado de columna */}
            <div className="flex items-center justify-between px-1 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: column.color ?? '#14b8a6' }}
                  aria-hidden
                />
                <span className="text-sm font-black text-teal-950">{column.name}</span>
                <span className="text-xs font-semibold text-slate-400">{columnLeads.length}</span>
              </div>
              <span className="text-[11px] font-black text-slate-400">{formatCurrency(total)}</span>
            </div>

            {/* Tarjetas */}
            <div className="flex flex-1 flex-col gap-2">
              {columnLeads.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                  Sin leads
                </p>
              ) : (
                columnLeads.map((lead) => (
                  <article
                    key={lead.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData('text/plain', String(lead.id))}
                    onClick={() => onEdit(lead)}
                    className="cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                  >
                    <p className="text-sm font-semibold text-slate-800">{lead.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{lead.customerName}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-black text-teal-700">
                        {lead.estimatedAmount != null ? formatCurrency(lead.estimatedAmount) : '—'}
                      </span>
                      <span className="text-[11px] text-slate-400">{lead.priority}</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}