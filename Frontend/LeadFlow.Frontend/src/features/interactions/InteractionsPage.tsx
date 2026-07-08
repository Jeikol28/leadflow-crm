import { useMemo, useState } from 'react'
import { useInteractions } from './useInteractions'
import { useDeleteInteraction } from './interactionMutations'
import { InteractionFormModal } from './InteractionFormModal'
import { DataTable } from '../../shared/components/DataTable'
import type { Column } from '../../shared/components/DataTable'
import { Pagination } from '../../shared/components/Pagination'
import { formatShortDate } from '../../shared/utils/format'
import { useToast } from '../../shared/toast/useToast'
import { useConfirm } from '../../shared/confirm/useConfirm'
import type { Interaction } from './interactions.types'

const PAGE_SIZE = 10

function typeStyle(type: string): { bg: string; text: string } {
  const t = type.toLowerCase()
  if (t.includes('llamada')) return { bg: 'bg-amber-100', text: 'text-amber-700' }
  if (t.includes('correo')) return { bg: 'bg-slate-100', text: 'text-slate-600' }
  if (t.includes('whatsapp')) return { bg: 'bg-emerald-100', text: 'text-emerald-700' }
  if (t.includes('reuni')) return { bg: 'bg-indigo-100', text: 'text-indigo-700' }
  if (t.includes('visita')) return { bg: 'bg-purple-100', text: 'text-purple-700' }
  return { bg: 'bg-sky-100', text: 'text-sky-700' }
}

export function InteractionsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Interaction | null>(null)

  const { data, isLoading, isFetching, error } = useInteractions(page, PAGE_SIZE)
  const deleteInteraction = useDeleteInteraction()
  const { showToast } = useToast()
  const confirm = useConfirm()

  const items = data?.items ?? []
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((interaction) =>
      [interaction.type, interaction.description, interaction.customerName, interaction.leadTitle].some(
        (field) => field?.toLowerCase().includes(term),
      ),
    )
  }, [items, search])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(interaction: Interaction) {
    setEditing(interaction)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleDelete(interaction: Interaction) {
    const ok = await confirm({
      title: 'Eliminar interacción',
      message: '¿Seguro que deseas eliminar esta interacción del historial?',
      confirmText: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    deleteInteraction.mutate(interaction.id, {
      onSuccess: () => showToast('Interacción eliminada.', 'success'),
      onError: () => showToast('No pudimos eliminar la interacción.', 'error'),
    })
  }

  const columns: Column<Interaction>[] = [
    {
      header: 'Tipo',
      cell: (interaction) => {
        const style = typeStyle(interaction.type)
        return (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${style.bg} ${style.text}`}>
            {interaction.type}
          </span>
        )
      },
    },
    {
      header: 'Descripción',
      cell: (interaction) => <p className="line-clamp-2 max-w-md text-sm text-slate-700">{interaction.description}</p>,
    },
    {
      header: 'Relacionada',
      cell: (interaction) => (
        <span className="text-sm text-slate-600">{interaction.customerName ?? interaction.leadTitle ?? '—'}</span>
      ),
    },
    { header: 'Usuario', cell: (interaction) => <span className="text-sm text-slate-600">{interaction.userFullName}</span> },
    {
      header: 'Fecha',
      cell: (interaction) => <span className="text-sm text-slate-500">{formatShortDate(interaction.interactionDate)}</span>,
    },
    {
      header: 'Acciones',
      align: 'right',
      cell: (interaction) => {
        const deleting = deleteInteraction.isPending && deleteInteraction.variables === interaction.id
        return (
          <span className="inline-flex items-center gap-2">
            <button
              onClick={() => openEdit(interaction)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(interaction)}
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
          <p className="text-xs font-black uppercase tracking-[0.1em] text-teal-600">Operaciones</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-teal-950">Interacciones</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data ? `${data.totalItems} interacci${data.totalItems === 1 ? 'ón' : 'ones'} registrada${data.totalItems === 1 ? '' : 's'}` : 'Cargando…'}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-10 rounded-xl bg-teal-950 px-4 text-sm font-black text-white shadow-[0_4px_14px_rgba(4,47,46,0.2)] transition-colors hover:bg-teal-800"
        >
          + Nueva interacción
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar en esta página…"
          className="h-10 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition-colors focus:border-teal-500"
          aria-label="Buscar interacciones"
        />
        {isFetching && <span className="text-xs text-slate-400">Actualizando…</span>}
      </div>

      {/* Tabla reutilizable */}
      <DataTable
        columns={columns}
        items={filtered}
        getRowKey={(interaction) => interaction.id}
        isLoading={isLoading}
        error={error}
        emptyMessage={search ? 'Ninguna interacción coincide con tu búsqueda.' : 'Aún no hay interacciones registradas.'}
      />

      {/* Paginación reutilizable */}
      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          hasPreviousPage={data.hasPreviousPage}
          hasNextPage={data.hasNextPage}
          onPageChange={setPage}
        />
      )}

      {/* Modal crear/editar */}
      {formOpen && <InteractionFormModal interaction={editing} onClose={closeForm} />}
    </div>
  )
}
