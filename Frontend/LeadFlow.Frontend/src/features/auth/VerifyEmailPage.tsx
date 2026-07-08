import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { CheckCircle2, Mail } from 'lucide-react'
import { resendVerification, verifyEmail } from './authService'

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

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState(() => new URLSearchParams(window.location.search).get('email') ?? '')
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [resendNotice, setResendNotice] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Cuenta regresiva para habilitar el reenvío del código.
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setResendNotice('')

    if (!/^\d{6}$/.test(code.trim())) {
      setErrorMessage('El código son 6 dígitos.')
      return
    }

    setIsSubmitting(true)
    try {
      await verifyEmail({ email: email.trim(), code: code.trim() })
      setSuccess(true)
      setTimeout(() => void navigate({ to: '/login' }), 2200)
    } catch (error) {
      setErrorMessage(getServerMessage(error, 'No pudimos verificar el código. Intenta de nuevo.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResend() {
    setErrorMessage('')
    setResendNotice('')
    try {
      await resendVerification(email.trim())
      setResendNotice('Si la cuenta existe y no está verificada, te enviamos un nuevo código.')
      setCooldown(30)
    } catch {
      setResendNotice('No pudimos reenviar el código. Intenta en unos minutos.')
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
          {success ? (
            <>
              <div className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={22} aria-hidden />
              </div>
              <h2 className="mt-6 text-2xl font-black tracking-[-0.03em] text-teal-950">Correo verificado</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Tu cuenta quedó activa. Te llevamos al inicio de sesión…
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
                <Mail size={22} aria-hidden />
              </div>
              <h2 className="mt-6 text-2xl font-black tracking-[-0.03em] text-teal-950">Verificá tu correo</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Te enviamos un código de 6 dígitos. Revisa tu bandeja (y la carpeta de spam) e
                ingrésalo aquí.
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

                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Código de verificación
                  </span>
                  <input
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-lg font-black tracking-[0.5em] text-slate-950 outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:opacity-60"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
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

                {resendNotice && (
                  <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold leading-6 text-teal-800">
                    {resendNotice}
                  </div>
                )}

                <button
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal-950 px-5 text-sm font-black text-white shadow-[0_18px_38px_rgba(4,47,46,0.18)] transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Verificando...' : 'Verificar cuenta'}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="text-teal-700 transition hover:text-teal-900 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {cooldown > 0 ? `Reenviar código (${cooldown}s)` : 'Reenviar código'}
                </button>
                <Link to="/login" className="transition hover:text-teal-900">
                  Volver a iniciar sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
