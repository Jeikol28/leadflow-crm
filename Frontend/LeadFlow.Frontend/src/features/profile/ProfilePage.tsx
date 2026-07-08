import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../../app/providers/AuthProvider'
import { useToast } from '../../shared/toast/useToast'
import { changePassword } from './profileService'

type PasswordForm = {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

const inputClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-teal-500'

const ROLE_LABELS: Record<string, string> = {
  AdminEmpresa: 'Administrador',
  Gerente: 'Gerente',
  Vendedor: 'Vendedor',
  Soporte: 'Soporte',
}

export function ProfilePage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordForm>({
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  })

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      showToast('Contraseña actualizada.', 'success')
      reset()
    },
    onError: () => showToast('No pudimos cambiar la contraseña. Verifica la contraseña actual.', 'error'),
  })

  function onSubmit(values: PasswordForm) {
    mutation.mutate(values)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.1em] text-teal-600">Cuenta</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-teal-950">Mi perfil</h1>
        <p className="mt-1 text-sm text-slate-500">Tus datos y seguridad.</p>
      </div>

      {/* Datos */}
      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
        <h2 className="text-base font-black text-teal-950">Datos</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-black uppercase tracking-wide text-slate-400">Nombre</dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-800">{user?.fullName ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-wide text-slate-400">Correo</dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-800">{user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-wide text-slate-400">Rol</dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-800">
              {user ? (ROLE_LABELS[user.role] ?? user.role) : '—'}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-400">
          Para cambiar tu nombre o rol, contacta al administrador de tu empresa.
        </p>
      </section>

      {/* Cambiar contraseña */}
      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
        <h2 className="text-base font-black text-teal-950">Cambiar contraseña</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 max-w-md space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Contraseña actual</span>
            <input type="password" {...register('currentPassword', { required: 'Obligatoria.' })} className={inputClass} />
            {errors.currentPassword && (
              <span className="mt-1 block text-xs font-semibold text-rose-600">{errors.currentPassword.message}</span>
            )}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Nueva contraseña</span>
            <input
              type="password"
              {...register('newPassword', {
                required: 'Obligatoria.',
                minLength: { value: 8, message: 'Mínimo 8 caracteres.' },
              })}
              className={inputClass}
            />
            {errors.newPassword && (
              <span className="mt-1 block text-xs font-semibold text-rose-600">{errors.newPassword.message}</span>
            )}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Confirmar nueva contraseña</span>
            <input
              type="password"
              {...register('confirmNewPassword', {
                required: 'Obligatoria.',
                validate: (value) => value === watch('newPassword') || 'Las contraseñas no coinciden.',
              })}
              className={inputClass}
            />
            {errors.confirmNewPassword && (
              <span className="mt-1 block text-xs font-semibold text-rose-600">{errors.confirmNewPassword.message}</span>
            )}
          </label>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="h-10 rounded-xl bg-teal-950 px-5 text-sm font-black text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
          >
            {mutation.isPending ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>
    </div>
  )
}
