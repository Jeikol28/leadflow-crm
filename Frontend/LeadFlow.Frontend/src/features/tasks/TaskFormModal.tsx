import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import type { Task, TaskInput } from './tasks.types'
import { useCreateTask, useUpdateTask } from './taskMutations'
import { useCurrentUserId } from './useCurrentUserId'
import { useCustomerOptions, useLeadOptions } from './useTaskOptions'
import { Modal } from '../../shared/components/Modal'
type TaskFormValues = {
  customerId: string
  leadId: string
  title: string
  description: string
  status: string
  priority: string
  dueDate: string
}

const inputClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-teal-500'
const textareaClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-teal-500'

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-semibold text-rose-600">{error}</span>}
    </label>
  )
}

function toFormValues(task: Task | null): TaskFormValues {
  return {
    customerId: task?.customerId != null ? String(task.customerId) : '',
    leadId: task?.leadId != null ? String(task.leadId) : '',
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'Pendiente',
    priority: task?.priority ?? 'Media',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
  }
}

function toInput(values: TaskFormValues, assignedUserId: number): TaskInput {
  return {
    customerId: values.customerId === '' ? null : Number(values.customerId),
    leadId: values.leadId === '' ? null : Number(values.leadId),
    assignedUserId,
    title: values.title.trim(),
    description: values.description.trim() === '' ? null : values.description.trim(),
    status: values.status,
    priority: values.priority,
    dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
  }
}

export function TaskFormModal({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const isEdit = task !== null
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const currentUserId = useCurrentUserId()
  const { options: customers } = useCustomerOptions()
  const { options: leads } = useLeadOptions()

  // En edición conservamos el asignado; al crear, asignamos al usuario actual.
  const assignedUserId = isEdit && task ? task.assignedUserId : currentUserId

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({ defaultValues: toFormValues(task) })

  const isPending = createTask.isPending || updateTask.isPending
  const hasServerError = createTask.isError || updateTask.isError

  function onSubmit(values: TaskFormValues) {
    if (assignedUserId == null) return
    const input = toInput(values, assignedUserId)
    if (isEdit && task) {
      updateTask.mutate({ id: task.id, input }, { onSuccess: onClose })
    } else {
      createTask.mutate(input, { onSuccess: onClose })
    }
  }

 return (
    <Modal title={isEdit ? 'Editar lead' : 'Nuevo lead'} onClose={onClose}>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <Field label="Título" required error={errors.title?.message}>
            <input {...register('title', { required: 'El título es obligatorio.' })} className={inputClass} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cliente">
              <select {...register('customerId')} className={inputClass}>
                <option value="">Sin cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Lead">
              <select {...register('leadId')} className={inputClass}>
                <option value="">Sin lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.title}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prioridad">
              <select {...register('priority')} className={inputClass}>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </Field>
            <Field label="Estado">
              <select {...register('status')} className={inputClass}>
                <option value="Pendiente">Pendiente</option>
                <option value="Completada">Completada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </Field>
          </div>

          <Field label="Fecha de vencimiento">
            <input type="date" {...register('dueDate')} className={inputClass} />
          </Field>

          <Field label="Descripción">
            <textarea rows={3} {...register('description')} className={textareaClass} />
          </Field>

          {hasServerError && (
            <p className="text-sm font-semibold text-rose-600">
              No pudimos guardar la tarea. Revisa los datos e intenta de nuevo.
            </p>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || assignedUserId == null}
              className="h-10 rounded-xl bg-teal-950 px-4 text-sm font-black text-white shadow-[0_4px_14px_rgba(4,47,46,0.2)] transition-colors hover:bg-teal-800 disabled:opacity-60"
            >
              {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </form>
    </Modal>
  )
}