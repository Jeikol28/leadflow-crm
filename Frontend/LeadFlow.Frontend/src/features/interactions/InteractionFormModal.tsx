import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import type { Interaction } from './interactions.types'
import { useCreateInteraction, useUpdateInteraction } from './interactionMutations'
import { useCustomerOptions, useLeadOptions } from './useInteractionOptions'
import { Modal } from '../../shared/components/Modal'
type InteractionFormValues = {
  customerId: string
  leadId: string
  type: string
  description: string
  interactionDate: string
}

const INTERACTION_TYPES = ['Llamada', 'Correo', 'WhatsApp', 'Reunión', 'Nota', 'Visita']

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

function toFormValues(interaction: Interaction | null): InteractionFormValues {
  return {
    customerId: interaction?.customerId != null ? String(interaction.customerId) : '',
    leadId: interaction?.leadId != null ? String(interaction.leadId) : '',
    type: interaction?.type ?? 'Llamada',
    description: interaction?.description ?? '',
    interactionDate: interaction?.interactionDate ? interaction.interactionDate.slice(0, 16) : '',
  }
}

function toIsoDate(value: string): string | null {
  return value ? new Date(value).toISOString() : null
}

export function InteractionFormModal({
  interaction,
  onClose,
}: {
  interaction: Interaction | null
  onClose: () => void
}) {
  const isEdit = interaction !== null
  const createInteraction = useCreateInteraction()
  const updateInteraction = useUpdateInteraction()
  const { options: customers } = useCustomerOptions()
  const { options: leads } = useLeadOptions()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InteractionFormValues>({ defaultValues: toFormValues(interaction) })

  const isPending = createInteraction.isPending || updateInteraction.isPending
  const hasServerError = createInteraction.isError || updateInteraction.isError

  function onSubmit(values: InteractionFormValues) {
    if (isEdit && interaction) {
      updateInteraction.mutate(
        {
          id: interaction.id,
          input: {
            type: values.type,
            description: values.description.trim(),
            interactionDate: toIsoDate(values.interactionDate),
          },
        },
        { onSuccess: onClose },
      )
    } else {
      createInteraction.mutate(
        {
          customerId: values.customerId === '' ? null : Number(values.customerId),
          leadId: values.leadId === '' ? null : Number(values.leadId),
          type: values.type,
          description: values.description.trim(),
          interactionDate: toIsoDate(values.interactionDate),
        },
        { onSuccess: onClose },
      )
    }
  }

 return (
    <Modal title={isEdit ? 'Editar lead' : 'Nuevo lead'} onClose={onClose}>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          {/* En edición el backend no permite cambiar el cliente/lead, así que solo se ven al crear */}
          {!isEdit && (
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
          )}

          {isEdit && (interaction?.customerName || interaction?.leadTitle) && (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Relacionada con: {interaction?.customerName ?? interaction?.leadTitle}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <select {...register('type')} className={inputClass}>
                {INTERACTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha y hora">
              <input type="datetime-local" {...register('interactionDate')} className={inputClass} />
            </Field>
          </div>

          <Field label="Descripción" required error={errors.description?.message}>
            <textarea
              rows={4}
              {...register('description', { required: 'La descripción es obligatoria.' })}
              className={textareaClass}
            />
          </Field>

          {hasServerError && (
            <p className="text-sm font-semibold text-rose-600">
              No pudimos guardar la interacción. Revisa los datos e intenta de nuevo.
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
              {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar'}
            </button>
          </div>
      </form>
    </Modal>
  )
}
