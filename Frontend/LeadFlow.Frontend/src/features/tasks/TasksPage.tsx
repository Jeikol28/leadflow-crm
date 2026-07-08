import { useMemo, useState } from 'react'
import { useTasks } from './useTasks'
import { useDeleteTask, useUpdateTaskStatus } from './taskMutations'
import { TaskFormModal } from './TaskFormModal'
import { DataTable } from '../../shared/components/DataTable'
import type { Column } from '../../shared/components/DataTable'
import { Pagination } from '../../shared/components/Pagination'
import { formatShortDate } from '../../shared/utils/format'
import { useToast } from '../../shared/toast/useToast'
import { useConfirm } from '../../shared/confirm/useConfirm'
import type { Task } from './tasks.types'

const PAGE_SIZE = 10

function statusStyle(status: string): { label: string; bg: string; text: string } {
  switch (status) {
    case 'Pendiente':
      return { label: 'Pendiente', bg: 'bg-amber-100', text: 'text-amber-700' }
    case 'Completada':
      return { label: 'Completada', bg: 'bg-emerald-100', text: 'text-emerald-700' }
    case 'Cancelada':
      return { label: 'Cancelada', bg: 'bg-slate-100', text: 'text-slate-600' }
    default:
      return { label: status, bg: 'bg-slate-100', text: 'text-slate-600' }
  }
}

function priorityStyle(priority: string): { bg: string; text: string } {
  const p = priority.toLowerCase()
  if (p === 'alta') return { bg: 'bg-red-100', text: 'text-red-700' }
  if (p === 'media') return { bg: 'bg-amber-100', text: 'text-amber-700' }
  return { bg: 'bg-slate-100', text: 'text-slate-600' }
}

export function TasksPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

  const { data, isLoading, isFetching, error } = useTasks(page, PAGE_SIZE)
  const deleteTask = useDeleteTask()
  const updateStatus = useUpdateTaskStatus()
  const { showToast } = useToast()
  const confirm = useConfirm()

  const completingId = updateStatus.isPending ? updateStatus.variables?.id ?? null : null

  const items = data?.items ?? []
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((task) =>
      [task.title, task.assignedUserName, task.customerName, task.leadTitle].some((field) =>
        field?.toLowerCase().includes(term),
      ),
    )
  }, [items, search])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(task: Task) {
    setEditing(task)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  function handleComplete(task: Task) {
    updateStatus.mutate(
      { id: task.id, status: 'Completada' },
      {
        onSuccess: () => showToast('Tarea completada.', 'success'),
        onError: () => showToast('No pudimos completar la tarea.', 'error'),
      },
    )
  }

  async function handleDelete(task: Task) {
    const ok = await confirm({
      title: 'Eliminar tarea',
      message: `¿Seguro que deseas eliminar la tarea "${task.title}"?`,
      confirmText: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    deleteTask.mutate(task.id, {
      onSuccess: () => showToast('Tarea eliminada.', 'success'),
      onError: () => showToast('No pudimos eliminar la tarea.', 'error'),
    })
  }

  const columns: Column<Task>[] = [
    {
      header: 'Tarea',
      cell: (task) => {
        const isDone = task.status === 'Completada'
        const target = task.customerName ?? task.leadTitle ?? '—'
        return (
          <div>
            <p className={`text-sm font-semibold ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
              {task.title}
            </p>
            <p className="text-xs text-slate-400">{target}</p>
          </div>
        )
      },
    },
    { header: 'Asignada a', cell: (task) => <span className="text-sm text-slate-600">{task.assignedUserName}</span> },
    {
      header: 'Estado',
      cell: (task) => {
        const style = statusStyle(task.status)
        return (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${style.bg} ${style.text}`}>
            {style.label}
          </span>
        )
      },
    },
    {
      header: 'Prioridad',
      cell: (task) => {
        const style = priorityStyle(task.priority)
        return (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${style.bg} ${style.text}`}>
            {task.priority}
          </span>
        )
      },
    },
    {
      header: 'Vence',
      cell: (task) => {
        const isDone = task.status === 'Completada'
        return (
          <span className={`text-sm ${task.isOverdue && !isDone ? 'font-black text-red-600' : 'text-slate-500'}`}>
            {formatShortDate(task.dueDate)}
          </span>
        )
      },
    },
    {
      header: 'Acciones',
      align: 'right',
      cell: (task) => {
        const deleting = deleteTask.isPending && deleteTask.variables === task.id
        return (
          <span className="inline-flex items-center gap-2">
            {task.status === 'Pendiente' && (
              <button
                onClick={() => handleComplete(task)}
                disabled={completingId === task.id}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60"
              >
                {completingId === task.id ? '...' : 'Completar'}
              </button>
            )}
            <button
              onClick={() => openEdit(task)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            >
              Editar
            </button>
            <button
              onClick={() => handleDelete(task)}
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-teal-600">Operaciones</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-teal-950">Tareas</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data ? `${data.totalItems} tarea${data.totalItems === 1 ? '' : 's'} en total` : 'Cargando…'}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-10 rounded-xl bg-teal-950 px-4 text-sm font-black text-white shadow-[0_4px_14px_rgba(4,47,46,0.2)] transition-colors hover:bg-teal-800"
        >
          + Nueva tarea
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar en esta página…"
          className="h-10 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition-colors focus:border-teal-500"
          aria-label="Buscar tareas"
        />
        {isFetching && <span className="text-xs text-slate-400">Actualizando…</span>}
      </div>

      <DataTable
        columns={columns}
        items={filtered}
        getRowKey={(task) => task.id}
        isLoading={isLoading}
        error={error}
        emptyMessage={search ? 'Ninguna tarea coincide con tu búsqueda.' : 'Aún no hay tareas registradas.'}
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

      {formOpen && <TaskFormModal task={editing} onClose={closeForm} />}
    </div>
  )
}