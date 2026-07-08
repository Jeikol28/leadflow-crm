import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useLeads } from './useLeads'
import { useDeleteLead } from './leadMutations'
import { LeadFormModal } from './LeadFormModal'
import { LeadsBoard } from './LeadsBoard'
import { DataTable } from '../../shared/components/DataTable'
import type { Column } from '../../shared/components/DataTable'
import { Pagination } from '../../shared/components/Pagination'
import { formatCurrency } from '../../shared/utils/format'
import { useToast } from '../../shared/toast/useToast'
import { useConfirm } from '../../shared/confirm/useConfirm'
import type { Lead } from './leads.types'

const PAGE_SIZE = 10

function priorityStyle(priority: string): { bg: string; text: string } {
  const p = priority.toLowerCase()
  if (p === 'alta') return { bg: 'bg-red-100', text: 'text-red-700' }
  if (p === 'media') return { bg: 'bg-amber-100', text: 'text-amber-700' }
  return { bg: 'bg-slate-100', text: 'text-slate-600' }
}

function temperatureStyle(temperature: string): { bg: string; text: string } {
  const t = temperature.toLowerCase()
  if (t.includes('calien')) return { bg: 'bg-red-100', text: 'text-red-700' }
  if (t.includes('tibi')) return { bg: 'bg-amber-100', text: 'text-amber-700' }
  if (t.includes('fri') || t.includes('frí')) return { bg: 'bg-sky-100', text: 'text-sky-700' }
  return { bg: 'bg-slate-100', text: 'text-slate-600' }
}

export function LeadsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [view, setView] = useState<'table' | 'kanban'>('table')

  const { data, isLoading, isFetching, error } = useLeads(page, PAGE_SIZE)
  const deleteLead = useDeleteLead()
  const { showToast } = useToast()
  const confirm = useConfirm()

  const items = data?.items ?? []
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((lead) =>
      [lead.title, lead.customerName, lead.status].some((field) => field?.toLowerCase().includes(term)),
    )
  }, [items, search])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(lead: Lead) {
    setEditing(lead)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleDelete(lead: Lead) {
    const ok = await confirm({
      title: 'Eliminar lead',
      message: `¿Seguro que deseas eliminar la oportunidad "${lead.title}"?`,
      confirmText: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    deleteLead.mutate(lead.id, {
      onSuccess: () => showToast('Lead eliminado.', 'success'),
      onError: () => showToast('No pudimos eliminar el lead.', 'error'),
    })
  }

  const columns: Column<Lead>[] = [
    {
      header: 'Oportunidad',
      cell: (lead) => (
        <div>
          <Link
            to="/app/leads/$leadId"
            params={{ leadId: String(lead.id) }}
            className="text-sm font-semibold text-teal-700 hover:underline"
          >
            {lead.title}
          </Link>
          <p className="text-xs text-slate-400">{lead.customerName}</p>
        </div>
      ),
    },
    {
      header: 'Estado',
      cell: (lead) => (
        <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-black text-teal-700">
          {lead.status}
        </span>
      ),
    },
    {
      header: 'Prioridad',
      cell: (lead) => {
        const style = priorityStyle(lead.priority)
        return (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${style.bg} ${style.text}`}>
            {lead.priority}
          </span>
        )
      },
    },
    {
      header: 'Monto',
      align: 'right',
      cell: (lead) => (
        <span className="text-sm font-black text-slate-900">
          {lead.estimatedAmount != null ? formatCurrency(lead.estimatedAmount) : '—'}
        </span>
      ),
    },
    {
      header: 'Temperatura',
      cell: (lead) => {
        const style = temperatureStyle(lead.temperature)
        return (
          <span>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${style.bg} ${style.text}`}>
              {lead.temperature || '—'}
            </span>
            <span className="ml-2 text-xs text-slate-400">Score {lead.score}</span>
          </span>
        )
      },
    },
    {
      header: 'Acciones',
      align: 'right',
      cell: (lead) => {
        const deleting = deleteLead.isPending && deleteLead.variables === lead.id
        return (
          <span className="inline-flex items-center gap-2">
            <button
              onClick={() => openEdit(lead)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(lead)}
              disabled={deleting}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
            >
              {deleting ? '...' : 'Eliminar'}
            </button>
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-teal-600">CRM</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-teal-950">Leads</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data ? `${data.totalItems} oportunidad${data.totalItems === 1 ? '' : 'es'} en total` : 'Cargando…'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              onClick={() => setView('table')}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition-colors ${
                view === 'table' ? 'bg-teal-950 text-white' : 'text-slate-500 hover:text-teal-900'
              }`}
            >
              Tabla
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition-colors ${
                view === 'kanban' ? 'bg-teal-950 text-white' : 'text-slate-500 hover:text-teal-900'
              }`}
            >
              Kanban
            </button>
          </div>
          <button
            onClick={openCreate}
            className="h-10 rounded-xl bg-teal-950 px-4 text-sm font-black text-white shadow-[0_4px_14px_rgba(4,47,46,0.2)] transition-colors hover:bg-teal-800"
          >
            + Nuevo lead
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar en esta página…"
              className="h-10 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition-colors focus:border-teal-500"
              aria-label="Buscar leads"
            />
            {isFetching && <span className="text-xs text-slate-400">Actualizando…</span>}
          </div>

          <DataTable
            columns={columns}
            items={filtered}
            getRowKey={(lead) => lead.id}
            isLoading={isLoading}
            error={error}
            emptyMessage={search ? 'Ningún lead coincide con tu búsqueda.' : 'Aún no hay leads registrados.'}
          />

          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              hasPreviousPage={data.hasPreviousPage}
              hasNextPage={data.hasNextPage}
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        <LeadsBoard onEdit={openEdit} />
      )}

      {formOpen && <LeadFormModal lead={editing} onClose={closeForm} />}
    </div>
  )
}