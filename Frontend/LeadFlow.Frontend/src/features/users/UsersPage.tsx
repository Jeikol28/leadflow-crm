import { useState } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { RequireRole } from '../../app/routes/RequireRole'
import { ROLES } from '../../shared/auth/roles'
import { DataTable } from '../../shared/components/DataTable'
import type { Column } from '../../shared/components/DataTable'
import { Pagination } from '../../shared/components/Pagination'
import { useUsers } from './useUsers'
import { useUpdateUserStatus } from './userMutations'
import { UserFormModal } from './UserFormModal'
import type { User } from './users.types'

const PAGE_SIZE = 10

const ROLE_LABELS: Record<string, string> = {
  AdminEmpresa: 'Administrador',
  Gerente: 'Gerente',
  Vendedor: 'Vendedor',
  Soporte: 'Soporte',
}

export function UsersPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === ROLES.AdminEmpresa

  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  const { data, isLoading, error } = useUsers(page, PAGE_SIZE)
  const updateStatus = useUpdateUserStatus()
  const togglingId = updateStatus.isPending ? updateStatus.variables?.id ?? null : null

  const items = data?.items ?? []

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(target: User) {
    setEditing(target)
    setFormOpen(true)
  }

  const columns: Column<User>[] = [
    {
      header: 'Usuario',
      cell: (target) => (
        <>
          <p className="text-sm font-semibold text-slate-800">
            {target.fullName}
            {target.email === user?.email && (
              <span className="ml-1.5 text-xs font-black text-teal-600">(tú)</span>
            )}
          </p>
          <p className="text-xs text-slate-400">{target.email}</p>
        </>
      ),
    },
    {
      header: 'Rol',
      cell: (target) => (
        <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-black text-teal-700">
          {ROLE_LABELS[target.role] ?? target.role}
        </span>
      ),
    },
    {
      header: 'Estado',
      cell: (target) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${
            target.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {target.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  // La columna de acciones solo existe para administradores.
  if (isAdmin) {
    columns.push({
      header: 'Acciones',
      align: 'right',
      cell: (target) =>
        target.email === user?.email ? (
          <span className="text-xs font-semibold text-slate-400">Tu cuenta</span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <button
              onClick={() => openEdit(target)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            >
              Editar
            </button>
            <button
              onClick={() => updateStatus.mutate({ id: target.id, isActive: !target.isActive })}
              disabled={togglingId === target.id}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              {togglingId === target.id ? '...' : target.isActive ? 'Desactivar' : 'Activar'}
            </button>
          </span>
        ),
    })
  }

  return (
    <RequireRole allowedRoles={[ROLES.AdminEmpresa, ROLES.Gerente]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.1em] text-teal-600">Sistema</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-teal-950">Usuarios</h1>
            <p className="mt-1 text-sm text-slate-500">
              {data ? `${data.totalItems} usuario${data.totalItems === 1 ? '' : 's'} en la empresa` : 'Cargando…'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="h-10 rounded-xl bg-teal-950 px-4 text-sm font-black text-white shadow-[0_4px_14px_rgba(4,47,46,0.2)] transition-colors hover:bg-teal-800"
            >
              + Nuevo usuario
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          items={items}
          getRowKey={(target) => target.id}
          isLoading={isLoading}
          error={error ? String(error) : null}
          emptyMessage="No hay usuarios registrados."
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

        {formOpen && <UserFormModal user={editing} onClose={() => setFormOpen(false)} />}
      </div>
    </RequireRole>
  )
}
