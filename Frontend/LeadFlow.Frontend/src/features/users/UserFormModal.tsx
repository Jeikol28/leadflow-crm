import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import type { User } from './users.types'
import { useCreateUser, useUpdateUser } from './userMutations'
import { ROLES } from '../../shared/auth/roles'
import { Modal } from '../../shared/components/Modal'
type UserFormValues = {
  fullName: string
  email: string
  password: string
  role: string
  isActive: string
}

const ROLE_OPTIONS = [
  { value: ROLES.AdminEmpresa, label: 'Administrador' },
  { value: ROLES.Gerente, label: 'Gerente' },
  { value: ROLES.Vendedor, label: 'Vendedor' },
  { value: ROLES.Soporte, label: 'Soporte' },
]

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

function toFormValues(user: User | null): UserFormValues {
  return {
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    password: '',
    role: user?.role ?? ROLES.Vendedor,
    isActive: user ? String(user.isActive) : 'true',
  }
}

export function UserFormModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const isEdit = user !== null
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({ defaultValues: toFormValues(user) })

  const isPending = createUser.isPending || updateUser.isPending
  const hasServerError = createUser.isError || updateUser.isError

  function onSubmit(values: UserFormValues) {
    if (isEdit && user) {
      updateUser.mutate(
        {
          id: user.id,
          input: {
            fullName: values.fullName.trim(),
            email: values.email.trim(),
            role: values.role,
            isActive: values.isActive === 'true',
          },
        },
        { onSuccess: onClose },
      )
    } else {
      createUser.mutate(
        {
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          password: values.password,
          role: values.role,
        },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <Modal title={isEdit ? 'Editar usuario' : 'Nuevo usuario'} onClose={onClose}>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <Field label="Nombre completo" required error={errors.fullName?.message}>
            <input {...register('fullName', { required: 'El nombre es obligatorio.' })} className={inputClass} />
          </Field>

          <Field label="Correo" required error={errors.email?.message}>
            <input
              type="email"
              {...register('email', {
                required: 'El correo es obligatorio.',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido.' },
              })}
              className={inputClass}
            />
          </Field>

          {!isEdit && (
            <Field label="Contraseña" required error={errors.password?.message}>
              <input
                type="password"
                {...register('password', {
                  required: 'La contraseña es obligatoria.',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres.' },
                })}
                className={inputClass}
              />
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rol">
              <select {...register('role')} className={inputClass}>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            {isEdit && (
              <Field label="Estado">
                <select {...register('isActive')} className={inputClass}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </Field>
            )}
          </div>

          {hasServerError && (
            <p className="text-sm font-semibold text-rose-600">
              No pudimos guardar el usuario. Revisa los datos (¿correo repetido?) e intenta de nuevo.
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
              {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
      </form>
    </Modal>
  )
}
