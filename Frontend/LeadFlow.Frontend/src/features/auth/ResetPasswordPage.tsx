import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, CheckCircle2, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { resetPassword } from './authService'

function getServerMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response
  ) {
    const data = error.response.data
    if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') {
      return data.message
    }
  }
  return fallback
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  // Leemos el token del enlace del correo (?token=...).
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (newPassword.length < 8) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword({ token, newPassword, confirmNewPassword: confirmPassword })
      setSuccess(true)
      // Llevamos al login luego de un momento para que el usuario vea la confirmación.
      setTimeout(() => void navigate({ to: '/login' }), 2200)
    } catch (error) {
      setErrorMessage(
        getServerMessage(error, 'No pudimos restablecer la contraseña. El enlace puede haber expirado.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f6fbf8] px-5 py-10 text-slate-950">
      <div className="w-full max-w-[440px]">
        <Link to="/" className="mb-8 flex items-center gap-3" style={{ color: '#042f2e' }}>
          <span className="grid size-10 place-items-center rounded-xl bg-teal-950 text-sm font-black text-cyan-200">
            LF
          </span>
          <span className="text-base font-black tracking-[-0.02em] text-teal-950">LeadFlow CRM</span>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          {!token ? (
            <>
              <div className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                <AlertTriangle size={22} aria-hidden />
              </div>
              <h2 className="mt-6 text-2xl font-black tracking-[-0.03em] text-teal-950">Enlace inválido</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Este enlace de recuperación no es válido o está incompleto. Solicita uno nuevo.
              </p>
              <Link
                to="/forgot-password"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-teal-950 px-5 text-sm font-black text-white transition hover:bg-teal-800"
              >
                Solicitar enlace nuevo
              </Link>
            </>
          ) : success ? (
            <>
              <div className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={22} aria-hidden />
              </div>
              <h2 className="mt-6 text-2xl font-black tracking-[-0.03em] text-teal-950">
                Contraseña actualizada
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Tu contraseña se restableció correctamente. Te llevamos al inicio de sesión…
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-teal-950 px-5 text-sm font-black text-white transition hover:bg-teal-800"
              >
                Ir a iniciar sesión
              </Link>
            </>
          ) : (
            <>
              <div className="grid size-12 place-items-center rounded-2xl bg-teal-950 text-cyan-200 shadow-[0_16px_34px_rgba(4,47,46,0.18)]">
                <LockKeyhole size={22} aria-hidden />
              </div>
              <h2 className="mt-6 text-2xl font-black tracking-[-0.03em] text-teal-950">
                Nueva contraseña
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Crea una contraseña segura para tu cuenta. Mínimo 8 caracteres.
              </p>

              <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Nueva contraseña
                  </span>
                  <div className="relative mt-2">
                    <input
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:opacity-60"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tu nueva contraseña"
                      autoComplete="new-password"
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-teal-900"
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Confirmar contraseña
                  </span>
                  <input
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:opacity-60"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    autoComplete="new-password"
                    required
                    disabled={isSubmitting}
                  />
                </label>

                {errorMessage && (
                  <div
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700"
                    role="alert"
                  >
                    {errorMessage}
                  </div>
                )}

                <button
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal-950 px-5 text-sm font-black text-white shadow-[0_18px_38px_rgba(4,47,46,0.18)] transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : 'Restablecer contraseña'}
                </button>
              </form>

              <div className="mt-7 text-sm font-semibold text-slate-500">
                <Link to="/login" className="transition hover:text-teal-900">
                  ← Volver a iniciar sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
