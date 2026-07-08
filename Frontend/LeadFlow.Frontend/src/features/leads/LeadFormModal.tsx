import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import type { Lead, LeadInput } from './leads.types'
import { useCreateLead, useUpdateLead } from './leadMutations'
import { useLeadStatuses } from './useLeadStatuses'
import { useCustomerOptions } from './useCustomerOptions'
import { Modal } from '../../shared/components/Modal'
type LeadFormValues = {
  customerId: string
  title: string
  description: string
  status: string
  priority: string
  estimatedAmount: string
  closeProbability: string
  expectedCloseDate: string
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

function toFormValues(lead: Lead | null): LeadFormValues {
  return {
    customerId: lead ? String(lead.customerId) : '',
    title: lead?.title ?? '',
    description: lead?.description ?? '',
    status: lead?.status ?? '',
    priority: lead?.priority ?? 'Media',
    estimatedAmount: lead?.estimatedAmount != null ? String(lead.estimatedAmount) : '',
    closeProbability: lead != null ? String(lead.closeProbability) : '0',
    expectedCloseDate: lead?.expectedCloseDate ? lead.expectedCloseDate.slice(0, 10) : '',
  }
}

// Convierte los valores del formulario al cuerpo que espera el backend.
function toInput(values: LeadFormValues): LeadInput {
  const probability = Number(values.closeProbability) || 0
  return {
    customerId: Number(values.customerId),
    title: values.title.trim(),
    description: values.description.trim() === '' ? null : values.description.trim(),
    status: values.status,
    priority: values.priority,
    estimatedAmount: values.estimatedAmount.trim() === '' ? null : Number(values.estimatedAmount),
    closeProbability: Math.min(100, Math.max(0, probability)),
    expectedCloseDate: values.expectedCloseDate ? new Date(values.expectedCloseDate).toISOString() : null,
  }
}

export function LeadFormModal({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const isEdit = lead !== null
  const createLead = useCreateLead()
  const updateLead = useUpdateLead()
  const { data: statuses } = useLeadStatuses()
  const { options: customers, isLoading: loadingCustomers } = useCustomerOptions()

  const activeStatuses = statuses
    .filter((status) => status.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  // Si editamos un lead cuyo estado ya no está en la lista activa, lo incluimos igual.
  const statusNames = activeStatuses.map((status) => status.name)
  const extraStatus = isEdit && lead && lead.status && !statusNames.includes(lead.status) ? lead.status : null

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormValues>({ defaultValues: toFormValues(lead) })

  const isPending = createLead.isPending || updateLead.isPending
  const hasServerError = createLead.isError || updateLead.isError

  function onSubmit(values: LeadFormValues) {
    const input = toInput(values)
    if (isEdit && lead) {
      updateLead.mutate({ id: lead.id, input }, { onSuccess: onClose })
    } else {
      createLead.mutate(input, { onSuccess: onClose })
    }
  }

 return (
    <Modal title={isEdit ? 'Editar lead' : 'Nuevo lead'} onClose={onClose}>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <Field label="Título" required error={errors.title?.message}>
            <input {...register('title', { required: 'El título es obligatorio.' })} className={inputClass} />
          </Field>

          <Field label="Cliente" required error={errors.customerId?.message}>
            <select
              {...register('customerId', { required: 'Selecciona un cliente.' })}
              className={inputClass}
              disabled={loadingCustomers}
            >
              <option value="">{loadingCustomers ? 'Cargando…' : 'Selecciona un cliente'}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estado" required error={errors.status?.message}>
              <select {...register('status', { required: 'Selecciona un estado.' })} className={inputClass}>
                <option value="">Selecciona un estado</option>
                {extraStatus && <option value={extraStatus}>{extraStatus}</option>}
                {activeStatuses.map((status) => (
                  <option key={status.id} value={status.name}>
                    {status.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Prioridad">
              <select {...register('priority')} className={inputClass}>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Monto estimado">
              <input type="number" step="any" min={0} {...register('estimatedAmount')} className={inputClass} />
            </Field>
            <Field label="Probabilidad de cierre (%)">
              <input type="number" min={0} max={100} {...register('closeProbability')} className={inputClass} />
            </Field>
          </div>

          <Field label="Fecha estimada de cierre">
            <input type="date" {...register('expectedCloseDate')} className={inputClass} />
          </Field>

          <Field label="Descripción">
            <textarea rows={3} {...register('description')} className={textareaClass} />
          </Field>

          {hasServerError && (
            <p className="text-sm font-semibold text-rose-600">
              No pudimos guardar el lead. Revisa los datos e intenta de nuevo.
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
              disabled={isPending}
              className="h-10 rounded-xl bg-teal-950 px-4 text-sm font-black text-white shadow-[0_4px_14px_rgba(4,47,46,0.2)] transition-colors hover:bg-teal-800 disabled:opacity-60"
            >
              {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear lead'}
            </button>
          </div>
        </form>
    </Modal>
  )
}