import { useMemo, useState } from 'react'
import { useServices } from './useServices'
import { useDeleteService } from './serviceMutations'
import { ServiceFormModal } from './ServiceFormModal'
import { DataTable } from '../../shared/components/DataTable'
import type { Column } from '../../shared/components/DataTable'
import { Pagination } from '../../shared/components/Pagination'
import { formatCurrency } from '../../shared/utils/format'
import { useToast } from '../../shared/toast/useToast'
import { useConfirm } from '../../shared/confirm/useConfirm'
import type { Service } from './services.types'

const PAGE_SIZE = 10

export function ServicesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)

  const { data, isLoading, isFetching, error } = useServices(page, PAGE_SIZE)
  const deleteService = useDeleteService()
  const { showToast } = useToast()
  const confirm = useConfirm()

  const items = data?.items ?? []
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((service) =>
      [service.name, service.description].some((field) => field?.toLowerCase().includes(term)),
    )
  }, [items, search])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(service: Service) {
    setEditing(service)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleDelete(service: Service) {
    const ok = await confirm({
      title: 'Eliminar servicio',
      message: `¿Seguro que deseas eliminar "${service.name}" del catálogo?`,
      confirmText: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    deleteService.mutate(service.id, {
      onSuccess: () => showToast('Servicio eliminado.', 'success'),
      onError: () => showToast('No pudimos eliminar el servicio.', 'error'),
    })
  }

  const columns: Column<Service>[] = [
    { header: 'Nombre', cell: (service) => <span className="text-sm font-semibold text-slate-800">{service.name}</span> },
    {
      header: 'Descripción',
      cell: (service) => <p className="line-clamp-1 max-w-md text-sm text-slate-500">{service.description ?? '—'}</p>,
    },
    {
      header: 'Precio',
      align: 'right',
      cell: (service) => <span className="text-sm font-black text-slate-900">{formatCurrency(service.price)}</span>,
    },
    {
      header: 'Estado',
      cell: (service) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${
            service.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {service.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      align: 'right',
      cell: (service) => {
        const deleting = deleteService.isPending && deleteService.variables === service.id
        return (
          <span className="inline-flex items-center gap-2">
            <button
              onClick={() => openEdit(service)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(service)}
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
          <h1 className="mt-1 text-2xl font-black tracking-tight text-teal-950">Servicios</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data ? `${data.totalItems} servicio${data.totalItems === 1 ? '' : 's'} en el catálogo` : 'Cargando…'}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-10 rounded-xl bg-teal-950 px-4 text-sm font-black text-white shadow-[0_4px_14px_rgba(4,47,46,0.2)] transition-colors hover:bg-teal-800"
        >
          + Nuevo servicio
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
          aria-label="Buscar servicios"
        />
        {isFetching && <span className="text-xs text-slate-400">Actualizando…</span>}
      </div>

      {/* Tabla reutilizable */}
      <DataTable
        columns={columns}
        items={filtered}
        getRowKey={(service) => service.id}
        isLoading={isLoading}
        error={error}
        emptyMessage={search ? 'Ningún servicio coincide con tu búsqueda.' : 'Aún no hay servicios en el catálogo.'}
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
      {formOpen && <ServiceFormModal service={editing} onClose={closeForm} />}
    </div>
  )
}
