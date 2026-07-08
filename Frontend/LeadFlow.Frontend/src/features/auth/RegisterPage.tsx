import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  BellRing,
  Bot,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
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

const WORKSPACE_FEATURES = [
  { icon: LayoutDashboard, label: 'Dashboard con métricas en tiempo real' },
  { icon: Bot,             label: 'Asistente IA de priorización comercial' },
  { icon: FileCheck2,      label: 'Cotizaciones con IVA 13% y PDF' },
  { icon: BellRing,        label: 'Alertas automáticas de seguimientos' },
  { icon: ShieldCheck,     label: 'Información privada y segura para tu empresa' },
]

function getRegisterErrorMessage(error: unknown): string {
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
  return 'No pudimos crear tu cuenta. Intenta nuevamente o contacta a soporte.'
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, isAuthenticated } = useAuth()
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Si ya hay sesión activa, no mostramos el registro: vamos directo al panel.
  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Verifica e intenta de nuevo.')
      return
    }

    if (!acceptTerms) {
      setErrorMessage('Debes aceptar los términos y la política de privacidad para continuar.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await register({
        companyName: companyName.trim(),
        adminFullName: fullName.trim(),
        adminEmail: email.trim(),
        password,
      })
      // La cuenta queda pendiente de verificación: vamos a la pantalla del código.
      await navigate({ to: '/verify-email', search: { email: result.email } })
    } catch (error) {
      setErrorMessage(getRegisterErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    'mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:opacity-60'

  const labelClass = 'text-xs font-black uppercase tracking-[0.12em] text-slate-500'

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
              Workspace listo en minutos
            </span>

            <h1 className="mt-7 text-balance text-5xl font-black leading-[1.02] tracking-[-0.035em] lg:text-[3.25rem]">
              Tu equipo comercial,{' '}
              <span className="bg-linear-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
                organizado desde el primer día.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-teal-50/80">
              LeadFlow crea tu empresa, tus usuarios y tu pipeline listos para
              operar. Sin configuración compleja ni integraciones de terceros.
            </p>

            {/* Lo que obtienes */}
            <div className="mt-9 rounded-2xl border border-white/10 bg-white/8 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <Building2 size={17} className="text-cyan-300" aria-hidden />
                <p className="text-sm font-black text-cyan-100">Al crear tu cuenta obtienes</p>
              </div>
              <ul className="mt-5 space-y-3" role="list">
                {WORKSPACE_FEATURES.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/10 text-cyan-300">
                      <Icon size={14} aria-hidden />
                    </span>
                    <span className="text-sm font-medium text-teal-50/90">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="relative z-10 max-w-sm text-sm leading-6 text-teal-50/55">
            En LeadFlow, la información de tu empresa es privada y solo tu
            equipo puede verla, con permisos según cada rol.
          </p>
        </motion.div>

        {/* ── Formulario derecho ── */}
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="flex min-h-dvh items-start justify-center px-5 py-10 sm:px-8 lg:items-center"
        >
          <div className="w-full max-w-[440px]">
            {/* Logo móvil */}
            <Link to="/" className="mb-8 flex items-center gap-3 lg:hidden" style={{ color: '#042f2e' }}>
              <span className="grid size-10 place-items-center rounded-xl bg-teal-950 text-sm font-black text-cyan-200">
                LF
              </span>
              <span className="text-base font-black tracking-[-0.02em] text-teal-950">LeadFlow CRM</span>
            </Link>

            {/* Encabezado */}
            <div className="mb-7">
              <div className="grid size-12 place-items-center rounded-2xl bg-teal-950 text-cyan-200 shadow-[0_16px_34px_rgba(4,47,46,0.18)]">
                <Building2 size={22} aria-hidden />
              </div>
              <h2 className="mt-6 text-3xl font-black tracking-[-0.03em] text-teal-950">
                Crear cuenta
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Crearemos el espacio de tu empresa, listo para que empieces a
                trabajar de una vez.
              </p>
            </div>

            {/* Formulario */}
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {/* Nombre completo */}
              <label className="block">
                <span className={labelClass}>Nombre completo</span>
                <input
                  className={inputClass}
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ana González"
                  autoComplete="name"
                  required
                  disabled={isSubmitting}
                />
              </label>

              {/* Empresa */}
              <label className="block">
                <span className={labelClass}>Nombre de la empresa</span>
                <input
                  className={inputClass}
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Soluciones Ticas S.A."
                  autoComplete="organization"
                  required
                  disabled={isSubmitting}
                />
              </label>

              {/* Correo */}
              <label className="block">
                <span className={labelClass}>Correo electrónico</span>
                <input
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ana@solucionesticas.cr"
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                />
              </label>

              {/* Contraseña */}
              <label className="block">
                <span className={labelClass}>Contraseña</span>
                <div className="relative mt-2">
                  <input
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:opacity-60"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    required
                    minLength={8}
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

              {/* Confirmar contraseña */}
              <label className="block">
                <span className={labelClass}>Confirmar contraseña</span>
                <div className="relative mt-2">
                  <input
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:opacity-60"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-teal-900 active:scale-95"
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showConfirmPassword ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
                  </button>
                </div>
              </label>

              {/* Términos */}
              <Checkbox
                className="pt-1 text-sm font-semibold text-slate-600"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
                label={
                  <span className="leading-6">
                    Acepto los{' '}
                    <a href="#terminos" className="font-black text-teal-700 underline underline-offset-2 hover:text-teal-900">
                      términos de servicio
                    </a>{' '}
                    y la{' '}
                    <a href="#privacidad" className="font-black text-teal-700 underline underline-offset-2 hover:text-teal-900">
                      política de privacidad
                    </a>{' '}
                    de LeadFlow.
                  </span>
                }
              />

              {/* Error */}
              {errorMessage && (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700"
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              {/* Submit */}
              <motion.button
                whileHover={isSubmitting ? {} : { y: -1 }}
                whileTap={isSubmitting ? {} : { scale: 0.98 }}
                className="group mt-1 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-teal-950 px-5 text-sm font-black text-white shadow-[0_18px_38px_rgba(4,47,46,0.18)] transition duration-200 hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
                <ArrowRight
                  size={17}
                  className="transition duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </motion.button>
            </form>

            {/* Badge workspace */}
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-teal-950/8 bg-white p-4 shadow-sm">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <CheckCircle2 size={18} aria-hidden />
              </span>
              <p className="text-sm leading-6 text-slate-500">
                Al registrarte creamos el{' '}
                <strong className="font-black text-slate-700">espacio de tu empresa</strong>,{' '}
                con tu información privada y separada de otras cuentas.
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-500">
              <Link to="/" className="transition hover:text-teal-900">
                ← Volver al inicio
              </Link>
              <div className="flex items-center gap-1.5">
                <span>¿Ya tienes cuenta?</span>
                <Link
                  to="/login"
                  className="font-black text-teal-700 transition hover:text-teal-900"
                >
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

      </section>
    </main>
  )
}
