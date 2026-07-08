import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useAuth } from '../../app/providers/AuthProvider'
import { Checkbox } from '../../shared/components/Checkbox'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const panelVariants: Variants = {
  hidden: { opacity: 0, x: -28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: EASE } },
}

const formVariants: Variants = {
  hidden: { opacity: 0, x: 28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, delay: 0.08, ease: EASE } },
}

function getLoginErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response
  ) {
    const data = error.response.data
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      return data.message
    }
  }
  return 'No pudimos iniciar sesión. Revisa el correo, la contraseña o intenta nuevamente.'
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Si ya hay sesión activa, no mostramos el login: vamos directo al panel.
  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await login({ email: email.trim(), password })
      await navigate({ to: '/app' })
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-dvh bg-[#f6fbf8] text-slate-950">
      <section className="grid min-h-dvh lg:grid-cols-[1.02fr_0.98fr]">

        {/* ── Panel izquierdo ── */}
        <motion.div
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          className="relative hidden overflow-hidden bg-teal-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.28),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.18),transparent_24%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[auto,auto,42px_42px,42px_42px]"
          />

          <Link to="/" className="relative z-10 flex items-center gap-3" style={{ color: 'white' }}>
            <span className="grid size-10 place-items-center rounded-xl bg-white text-sm font-black text-teal-950">
              LF
            </span>
            <span className="text-base font-black tracking-[-0.02em]">LeadFlow CRM</span>
          </Link>

          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-cyan-100">
              <Sparkles size={14} aria-hidden />
              Inteligencia comercial
            </span>

            <h1 className="mt-7 text-balance text-5xl font-black leading-[1.02] tracking-[-0.035em] lg:text-[3.25rem]">
              Entra con claridad.{' '}
              <span className="bg-linear-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
                Vende con prioridad.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-teal-50/80">
              Centraliza clientes, oportunidades, tareas y cotizaciones para
              que tu equipo sepa dónde actuar primero.
            </p>

            {/* Mini dashboard card */}
            <div className="mt-9 grid max-w-md gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-cyan-100">Seguimientos a tiempo</span>
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-teal-950">
                    +24%
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-linear-to-r from-teal-300 to-cyan-300"
                    initial={{ width: 0 }}
                    animate={{ width: '72%' }}
                    transition={{ duration: 1.1, delay: 0.7, ease: EASE }}
                  />
                </div>
                <p className="mt-4 text-sm leading-6 text-teal-50/70">
                  Prioriza leads calientes, tareas vencidas y cotizaciones
                  abiertas sin buscar información en varios lugares.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <TrendingUp size={19} className="text-cyan-200" aria-hidden />
                  <p className="mt-3 text-sm font-black">Pipeline vivo</p>
                  <p className="mt-0.5 text-xs text-teal-50/60">3 oportunidades calientes</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <ShieldCheck size={19} className="text-cyan-200" aria-hidden />
                  <p className="mt-3 text-sm font-black">Acceso seguro</p>
                  <p className="mt-0.5 text-xs text-teal-50/60">JWT + auditoría</p>
                </div>
              </div>
            </div>
          </div>

          <p className="relative z-10 max-w-sm text-sm leading-6 text-teal-50/55">
            LeadFlow protege cada sesión con autenticación segura, roles por
            empresa y control de acceso por módulo.
          </p>
        </motion.div>

        {/* ── Formulario derecho ── */}
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="flex min-h-dvh items-center justify-center px-5 py-10 sm:px-8"
        >
          <div className="w-full max-w-[440px]">
            {/* Logo móvil */}
            <Link to="/" className="mb-10 flex items-center gap-3 lg:hidden" style={{ color: '#042f2e' }}>
              <span className="grid size-10 place-items-center rounded-xl bg-teal-950 text-sm font-black text-cyan-200">
                LF
              </span>
              <span className="text-base font-black tracking-[-0.02em] text-teal-950">LeadFlow CRM</span>
            </Link>

            {/* Encabezado */}
            <div className="mb-8">
              <div className="grid size-12 place-items-center rounded-2xl bg-teal-950 text-cyan-200 shadow-[0_16px_34px_rgba(4,47,46,0.18)]">
                <LockKeyhole size={22} aria-hidden />
              </div>
              <h2 className="mt-6 text-3xl font-black tracking-[-0.03em] text-teal-950">
                Bienvenido de nuevo
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Ingresa a tu espacio comercial para continuar gestionando
                clientes, oportunidades y seguimientos.
              </p>
            </div>

            {/* Formulario */}
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  Correo electrónico
                </span>
                <input
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:opacity-60"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@solucionesticas.cr"
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                />
              </label>

              <label className="block">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Contraseña
                  </span>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-black text-teal-700 transition hover:text-teal-900"
                  >
                    Olvidé mi contraseña
                  </Link>
                </div>
                <div className="relative mt-2">
                  <input
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:opacity-60"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-teal-900 active:scale-95"
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
                  </button>
                </div>
              </label>

              <Checkbox
                className="text-sm font-semibold text-slate-600"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                label="Recordarme en este dispositivo"
              />

              {errorMessage && (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700"
                  role="alert"
                >
                  {errorMessage}
                  {errorMessage.toLowerCase().includes('verific') && (
                    <Link
                      to="/verify-email"
                      search={{ email: email.trim() }}
                      className="mt-1 block font-black text-teal-700 underline underline-offset-2 hover:text-teal-900"
                    >
                      Verificar mi correo ahora
                    </Link>
                  )}
                </div>
              )}

              <motion.button
                whileHover={isSubmitting ? {} : { y: -1 }}
                whileTap={isSubmitting ? {} : { scale: 0.98 }}
                className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-teal-950 px-5 text-sm font-black text-white shadow-[0_18px_38px_rgba(4,47,46,0.18)] transition duration-200 hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
                <ArrowRight
                  size={17}
                  className="transition duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </motion.button>
            </form>

            {/* Separador */}
            <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <span className="h-px bg-slate-200" />
              <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Acceso protegido
              </span>
              <span className="h-px bg-slate-200" />
            </div>

            {/* Badge de confianza */}
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-teal-950/8 bg-white p-4 shadow-sm">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <ShieldCheck size={18} aria-hidden />
              </span>
              <p className="text-sm leading-6 text-slate-500">
                Tu información se mantiene{' '}
                <strong className="font-black text-slate-700">segura y privada</strong>,{' '}
                separada de la de otras empresas.
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-500">
              <Link to="/" className="transition hover:text-teal-900">
                ← Volver al inicio
              </Link>
              <div className="flex items-center gap-1.5">
                <span>¿Sin cuenta aún?</span>
                <Link
                  to="/register"
                  className="font-black text-teal-700 transition hover:text-teal-900"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

      </section>
    </main>
  )
}
