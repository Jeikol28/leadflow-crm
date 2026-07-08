import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { CheckCircle2, LockKeyhole } from 'lucide-react'
import { forgotPassword } from './authService'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      await forgotPassword(email.trim())
      setSubmitted(true)
    } catch {
      // El backend responde neutral; un error acá suele ser de red o rate limit.
      setErrorMessage('No pudimos procesar la solicitud. Intenta de nuevo en unos minutos.')
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

        {submitted ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
              <CheckCircle2 size={22} aria-hidden />
            </div>
            <h2 className="mt-6 text-2xl font-black tracking-[-0.03em] text-teal-950">Revisa tu correo</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Si el correo está registrado y activo, te enviamos un enlace para restablecer tu
              contraseña. Revisa también la carpeta de spam.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-teal-950 px-5 text-sm font-black text-white transition hover:bg-teal-800"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="grid size-12 place-items-center rounded-2xl bg-teal-950 text-cyan-200 shadow-[0_16px_34px_rgba(4,47,46,0.18)]">
              <LockKeyhole size={22} aria-hidden />
            </div>
            <h2 className="mt-6 text-2xl font-black tracking-[-0.03em] text-teal-950">
              Recuperar contraseña
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ingresa el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
            </p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Correo electrónico
                </span>
                <input
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:opacity-60"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@empresa.com"
                  autoComplete="email"
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
                {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>

            <div className="mt-7 text-sm font-semibold text-slate-500">
              <Link to="/login" className="transition hover:text-teal-900">
                ← Volver a iniciar sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
