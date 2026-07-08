import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import type { Customer, CustomerInput } from './customers.types'
import { useCreateCustomer, useUpdateCustomer } from './customerMutations'
import { Modal } from '../../shared/components/Modal'
type CustomerFormValues = {
  name: string
  email: string
  phone: string
  province: string
  canton: string
  address: string
  source: string
  status: string
}

const inputClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-teal-500'

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

function toFormValues(customer: Customer | null): CustomerFormValues {
  return {
    name: customer?.name ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    province: customer?.province ?? '',
    canton: customer?.canton ?? '',
    address: customer?.address ?? '',
    source: customer?.source ?? '',
    status: customer?.status ?? 'Active',
  }
}

// Convierte los valores del formulario al cuerpo que espera el backend (vacío → null).
function toInput(values: CustomerFormValues): CustomerInput {
  const clean = (value: string) => (value.trim() === '' ? null : value.trim())
  return {
    name: values.name.trim(),
    email: clean(values.email),
    phone: clean(values.phone),
    province: clean(values.province),
    canton: clean(values.canton),
    address: clean(values.address),
    source: clean(values.source),
    status: values.status,
  }
}

export function CustomerFormModal({
  customer,
  onClose,
}: {
  customer: Customer | null
  onClose: () => void
}) {
  const isEdit = customer !== null
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({ defaultValues: toFormValues(customer) })

  const isPending = createCustomer.isPending || updateCustomer.isPending
  const hasServerError = createCustomer.isError || updateCustomer.isError

  function onSubmit(values: CustomerFormValues) {
    const input = toInput(values)
    if (isEdit && customer) {
      updateCustomer.mutate({ id: customer.id, input }, { onSuccess: onClose })
    } else {
      createCustomer.mutate(input, { onSuccess: onClose })
    }
  }

 return (
    <Modal title={isEdit ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}>
      <p className="mt-0.5 text-sm text-slate-500">Completa los datos del cliente.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <Field label="Nombre" required error={errors.name?.message}>
            <input
              {...register('name', {
                required: 'El nombre es obligatorio.',
                maxLength: { value: 150, message: 'Máximo 150 caracteres.' },
              })}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Correo" error={errors.email?.message}>
              <input
                type="email"
                {...register('email', {
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido.' },
                })}
                className={inputClass}
              />
            </Field>
            <Field label="Teléfono">
              <input {...register('phone')} className={inputClass} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Provincia">
              <input {...register('province')} className={inputClass} />
            </Field>
            <Field label="Cantón">
              <input {...register('canton')} className={inputClass} />
            </Field>
          </div>

          <Field label="Dirección">
            <input {...register('address')} className={inputClass} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Origen">
              <input {...register('source')} placeholder="Web, Referido…" className={inputClass} />
            </Field>
            <Field label="Estado">
              <select {...register('status')} className={inputClass}>
                <option value="Active">Activo</option>
                <option value="Inactive">Inactivo</option>
              </select>
            </Field>
          </div>

          {hasServerError && (
            <p className="text-sm font-semibold text-rose-600">
              No pudimos guardar el cliente. Revisa los datos e intenta de nuevo.
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
              {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
       </form>
    </Modal>
  )
}