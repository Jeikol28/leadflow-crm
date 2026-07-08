import { useState } from 'react'
import { RequireRole } from '../../app/routes/RequireRole'
import { ROLES } from '../../shared/auth/roles'
import { DataTable } from '../../shared/components/DataTable'
import type { Column } from '../../shared/components/DataTable'
import { Pagination } from '../../shared/components/Pagination'
import { useAuditLogs } from './useAuditLogs'
import type { AuditFilters, AuditLog } from './audit.types'

const PAGE_SIZE = 15

const inputClass =
  'h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-teal-500'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const EMPTY_FILTERS: AuditFilters = { from: '', to: '', entityName: '', action: '' }

export function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching, error } = useAuditLogs(filters, page, PAGE_SIZE)

  function updateFilter(key: keyof AuditFilters, value: string) {
    setPage(1)
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const items = data?.items ?? []
  const hasFilters = Boolean(filters.from || filters.to || filters.entityName || filters.action)

  const columns: Column<AuditLog>[] = [
    {
      header: 'Fecha',
      cell: (log) => <span className="whitespace-nowrap text-sm text-slate-500">{formatDateTime(log.createdAt)}</span>,
    },
    {
      header: 'Usuario',
      cell: (log) => (
        <>
          <p className="text-sm font-semibold text-slate-800">{log.userEmail ?? 'Sistema'}</p>
          {log.userRole && <p className="text-xs text-slate-400">{log.userRole}</p>}
        </>
      ),
    },
    {
      header: 'Acción',
      cell: (log) => (
        <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-black text-teal-700">
          {log.action}
        </span>
      ),
    },
    {
      header: 'Entidad',
      cell: (log) => (
        <span className="text-sm text-slate-600">
          {log.entityName}
          {log.entityId != null && <span className="text-slate-400"> #{log.entityId}</span>}
        </span>
      ),
    },
    {
      header: 'Descripción',
      cell: (log) => <span className="text-sm text-slate-600">{log.description}</span>,
    },
  ]

  return (
    <RequireRole allowedRoles={[ROLES.AdminEmpresa, ROLES.Gerente]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-teal-600">Sistema</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-teal-950">Auditoría</h1>
          <p className="mt-1 text-sm text-slate-500">Bitácora de acciones administrativas.</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Desde</span>
            <input type="date" value={filters.from} onChange={(e) => updateFilter('from', e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Hasta</span>
            <input type="date" value={filters.to} onChange={(e) => updateFilter('to', e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Entidad</span>
            <input
              type="text"
              value={filters.entityName}
              onChange={(e) => updateFilter('entityName', e.target.value)}
              placeholder="Lead, Quote…"
              className={`${inputClass} w-40`}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Acción</span>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => updateFilter('action', e.target.value)}
              placeholder="Create, Update…"
              className={`${inputClass} w-40`}
            />
          </label>
          {hasFilters && (
            <button
              onClick={() => {
                setPage(1)
                setFilters(EMPTY_FILTERS)
              }}
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Limpiar
            </button>
          )}
          {isFetching && <span className="pb-2 text-xs text-slate-400">Actualizando…</span>}
        </div>

        <DataTable
          columns={columns}
          items={items}
          getRowKey={(log) => log.id}
          isLoading={isLoading}
          error={error ? String(error) : null}
          emptyMessage="No hay registros que coincidan con los filtros."
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
      </div>
    </RequireRole>
  )
}
