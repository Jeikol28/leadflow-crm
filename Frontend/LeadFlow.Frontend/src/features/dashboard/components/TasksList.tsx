import type { DashboardTask } from '../dashboard.types'
import { useCompleteTask } from '../useCompleteTask'
import { formatShortDate } from '../../../shared/utils/format'
import { useConfirm } from '../../../shared/confirm/useConfirm'
import { Checkbox } from '../../../shared/components/Checkbox'

// Traduce la prioridad (texto del backend) a estilos de color.
function priorityStyle(priority: string) {
  const p = priority.toLowerCase()
  if (p === 'alta') return { label: 'Alta', bg: 'bg-red-100', text: 'text-red-700' }
  if (p === 'media') return { label: 'Media', bg: 'bg-amber-100', text: 'text-amber-700' }
  if (p === 'baja') return { label: 'Baja', bg: 'bg-slate-100', text: 'text-slate-600' }
  return { label: priority, bg: 'bg-slate-100', text: 'text-slate-600' }
}

function TaskRow({
  task,
  onComplete,
  isCompleting,
}: {
  task: DashboardTask
  onComplete: (task: DashboardTask) => void
  isCompleting: boolean
}) {
  const priority = priorityStyle(task.priority)
  const client = task.customerName ?? task.leadTitle ?? '—'

  return (
    <li className={`flex items-center gap-3 py-3 transition-opacity ${isCompleting ? 'opacity-50' : ''}`}>
      <Checkbox
        checked={false}
        onChange={() => onComplete(task)}
        disabled={isCompleting}
        className="shrink-0"
        aria-label={`Marcar como completada: ${task.title}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{task.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{client}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${priority.bg} ${priority.text}`}>
          {priority.label}
        </span>
        <span className={`text-[11px] ${task.isOverdue ? 'font-black text-red-600' : 'text-slate-400'}`}>
          {formatShortDate(task.dueDate)}
        </span>
      </div>
    </li>
  )
}

export function TasksList({ tasks }: { tasks: DashboardTask[] }) {
  const completeTask = useCompleteTask()
  const confirm = useConfirm()
  const completingId = completeTask.isPending ? completeTask.variables : null
  const overdueCount = tasks.filter((task) => task.isOverdue).length

  // Pide confirmación antes de completar para evitar clics accidentales.
  async function handleComplete(task: DashboardTask) {
    const ok = await confirm({
      title: 'Completar tarea',
      message: `¿Marcar "${task.title}" como completada?`,
      confirmText: 'Completar',
    })
    if (!ok) return
    completeTask.mutate(task.id)
  }

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-teal-950">Tareas pendientes</h2>
          <p className="mt-0.5 text-sm text-slate-500">Marca una tarea para completarla</p>
        </div>
        {overdueCount > 0 && (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-700">
            {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {tasks.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">
          No hay tareas próximas.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100" role="list">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={handleComplete}
              isCompleting={completingId === task.id}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
