import { useMemo, useState } from 'react'
import { useCustomers } from './useCustomers'
import { useDeleteCustomer } from './customerMutations'
import { CustomerFormModal } from './CustomerFormModal'
import { DataTable } from '../../shared/components/DataTable'
import type { Column } from '../../shared/components/DataTable'
import { Pagination } from '../../shared/components/Pagination'
import { formatShortDate } from '../../shared/utils/format'
import { useToast } from '../../shared/toast/useToast'
import { useConfirm } from '../../shared/confirm/useConfirm'
import type { Customer } from './customers.types'

const PAGE_SIZE = 10

function statusStyle(status: string): { bg: string; text: string } {
  const s = status.toLowerCase()
  if (s === 'active' || s === 'activo') return { bg: 'bg-emerald-100', text: 'text-emerald-700' }
  if (s === 'inactive' || s === 'inactivo') return { bg: 'bg-slate-100', text: 'text-slate-600' }
  return { bg: 'bg-sky-100', text: 'text-sky-700' }
}

export function CustomersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  const { data, isLoading, isFetching, error } = useCustomers(page, PAGE_SIZE)
  const deleteCustomer = useDeleteCustomer()
  const { showToast } = useToast()
  const confirm = useConfirm()

  const items = data?.items ?? []
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.province].some((field) =>
        field?.toLowerCase().includes(term),
      ),
    )
  }, [items, search])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(customer: Customer) {
    setEditing(customer)
    setFormOpen(true)
  }
  
  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleDelete(customer: Customer) {
    const ok = await confirm({
      title: 'Eliminar cliente',
      message: `¿Seguro que deseas eliminar a ${customer.name}? Se desactivará del sistema.`,
      confirmText: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    deleteCustomer.mutate(customer.id, {
      onSuccess: () => showToast('Cliente eliminado.', 'success'),
      onError: () => showToast('No pudimos eliminar el cliente.', 'error'),
    })
  }

  // Definición declarativa de las columnas: qué título y cómo se ve cada celda.
  const columns: Column<Customer>[] = [
    {
      header: 'Cliente',
      cell: (customer) => (
        <div>
          <p className="text-sm font-semibold text-slate-800">{customer.name}</p>
          <p className="text-xs text-slate-400">Desde {formatShortDate(customer.createdAt)}</p>
        </div>
      ),
    },
    {
      header: 'Contacto',
      cell: (customer) => (
        <div className="text-sm text-slate-600">
          <p>{customer.email ?? '—'}</p>
          <p className="text-xs text-slate-400">{customer.phone ?? '—'}</p>
        </div>
      ),
    },
    { header: 'Provincia', cell: (customer) => <span className="text-sm text-slate-600">{customer.province ?? '—'}</span> },
    { header: 'Origen', cell: (customer) => <span className="text-sm text-slate-600">{customer.source ?? '—'}</span> },
    {
      header: 'Estado',
      cell: (customer) => {
        const style = statusStyle(customer.status)
        return (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${style.bg} ${style.text}`}>
            {customer.status}
          </span>
        )
      },
    },
    {
      header: 'Acciones',
      align: 'right',
      cell: (customer) => {
        const deleting = deleteCustomer.isPending && deleteCustomer.variables === customer.id
        return (
          <span className="inline-flex items-center gap-2">
            <button
              onClick={() => openEdit(customer)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(customer)}
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
          <h1 className="mt-1 text-2xl font-black tracking-tight text-teal-950">Clientes</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data ? `${data.totalItems} cliente${data.totalItems === 1 ? '' : 's'} en total` : 'Cargando…'}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-10 rounded-xl bg-teal-950 px-4 text-sm font-black text-white shadow-[0_4px_14px_rgba(4,47,46,0.2)] transition-colors hover:bg-teal-800"
        >
          + Nuevo cliente
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
          aria-label="Buscar clientes"
        />
        {isFetching && <span className="text-xs text-slate-400">Actualizando…</span>}
      </div>

      {/* Tabla reutilizable */}
      <DataTable
        columns={columns}
        items={filtered}
        getRowKey={(customer) => customer.id}
        isLoading={isLoading}
        error={error}
        emptyMessage={search ? 'Ningún cliente coincide con tu búsqueda.' : 'Aún no hay clientes registrados.'}
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
      {formOpen && <CustomerFormModal customer={editing} onClose={closeForm} />}
    </div>
  )
}