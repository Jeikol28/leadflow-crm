import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import type { Service, ServiceInput } from './services.types'
import { useCreateService, useUpdateService } from './serviceMutations'
import { Modal } from '../../shared/components/Modal'
type ServiceFormValues = {
  name: string
  description: string
  price: string
  isActive: string
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

function toFormValues(service: Service | null): ServiceFormValues {
  return {
    name: service?.name ?? '',
    description: service?.description ?? '',
    price: service != null ? String(service.price) : '',
    isActive: service ? String(service.isActive) : 'true',
  }
}

function toInput(values: ServiceFormValues): ServiceInput {
  return {
    name: values.name.trim(),
    description: values.description.trim() === '' ? null : values.description.trim(),
    price: Number(values.price) || 0,
    isActive: values.isActive === 'true',
  }
}

export function ServiceFormModal({ service, onClose }: { service: Service | null; onClose: () => void }) {
  const isEdit = service !== null
  const createService = useCreateService()
  const updateService = useUpdateService()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormValues>({ defaultValues: toFormValues(service) })

  const isPending = createService.isPending || updateService.isPending
  const hasServerError = createService.isError || updateService.isError

  function onSubmit(values: ServiceFormValues) {
    const input = toInput(values)
    if (isEdit && service) {
      updateService.mutate({ id: service.id, input }, { onSuccess: onClose })
    } else {
      createService.mutate(input, { onSuccess: onClose })
    }
  }

  return (
    <Modal title={isEdit ? 'Editar lead' : 'Nuevo lead'} onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <Field label="Nombre" required error={errors.name?.message}>
            <input {...register('name', { required: 'El nombre es obligatorio.' })} className={inputClass} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Precio" required error={errors.price?.message}>
              <input
                type="number"
                step="any"
                min={0}
                {...register('price', { required: 'El precio es obligatorio.' })}
                className={inputClass}
              />
            </Field>
            <Field label="Estado">
              <select {...register('isActive')} className={inputClass}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </Field>
          </div>

          <Field label="Descripción">
            <textarea rows={3} {...register('description')} className={textareaClass} />
          </Field>

          {hasServerError && (
            <p className="text-sm font-semibold text-rose-600">
              No pudimos guardar el servicio. Revisa los datos e intenta de nuevo.
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
              {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear servicio'}
            </button>
          </div>
       </form>
    </Modal>
  )
}
