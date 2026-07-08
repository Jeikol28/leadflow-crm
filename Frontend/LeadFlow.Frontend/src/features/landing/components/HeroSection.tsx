import { useRef } from 'react'
import {
  ArrowRight,
  BellRing,
  Bot,
  FileCheck2,
  Fingerprint,
  Layers3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { motion, useInView, type Variants } from 'framer-motion'

// ─── Static data ───────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  { icon: Layers3,     label: 'Multiempresa'         },
  { icon: FileCheck2,  label: 'IVA 13% Costa Rica'   },
  { icon: ShieldCheck, label: 'JWT + auditoría'       },
  { icon: BellRing,    label: 'Alertas en tiempo real'},
  { icon: Fingerprint, label: 'Roles y permisos'      },
]

const PIPELINE_CARDS = [
  {
    label:       'Nuevo',
    labelColor:  'bg-emerald-100 text-emerald-800',
    title:       'Distribuidora La Sabana',
    value:       'CRC 2.2M',
    detail:      'Lead caliente · prob. alta',
    prob:        75,
    icon:        TrendingUp,
    iconColor:   'text-emerald-600',
    motionClass: 'pipeline-card-one',
  },
  {
    label:       'Vencida',
    labelColor:  'bg-red-100 text-red-700',
    title:       'Llamar cliente clave',
    value:       'Hoy',
    detail:      'Alerta crítica automática',
    prob:        null,
    icon:        Clock,
    iconColor:   'text-red-500',
    motionClass: 'pipeline-card-two',
  },
  {
    label:       'Cotización',
    labelColor:  'bg-sky-100 text-sky-800',
    title:       'STC-2026-0001',
    value:       'IVA 13%',
    detail:      'PDF listo para enviar',
    prob:        null,
    icon:        FileCheck2,
    iconColor:   'text-sky-600',
    motionClass: 'pipeline-card-three',
  },
]

const AI_ACTIONS = [
  { text: 'Contactar cliente de alto valor', done: false },
  { text: 'Enviar seguimiento de cotización', done: false },
  { text: 'Actualizar estado del lead',       done: true  },
]

const SIDEBAR_ICONS: LucideIcon[] = [Layers3, Bot, FileCheck2, BellRing, ShieldCheck]

// ─── Sub-components ────────────────────────────────────────────────────────────

function TrustPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
      <Icon size={13} className="shrink-0 text-teal-600" aria-hidden />
      {label}
    </span>
  )
}

function LiveDot() {
  return (
    <span className="relative flex size-2" aria-hidden>
      <motion.span
        className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75"
        animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
    </span>
  )
}

function PipelineCard({
  card,
  index,
  inView,
}: {
  card: (typeof PIPELINE_CARDS)[number]
  index: number
  inView: boolean
}) {
  const Icon = card.icon

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(15,23,42,0.13)' }}
      className={`${card.motionClass} cursor-default rounded-2xl border border-white bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.07)]`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${card.labelColor}`}>
          {card.label}
        </span>
        <div className="flex items-center gap-1">
          <Icon size={12} className={card.iconColor} aria-hidden />
          <strong className="text-[11px] font-black text-teal-950">{card.value}</strong>
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-3 text-sm font-black leading-snug text-slate-900">{card.title}</h3>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">{card.detail}</p>

      {/* Probability bar (only on first card) */}
      {card.prob !== null && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400">Probabilidad</span>
            <span className="text-[10px] font-black text-emerald-700">{card.prob}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
              initial={{ width: 0 }}
              animate={inView ? { width: `${card.prob}%` } : {}}
              transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      )}
    </motion.article>
  )
}

function AIActionItem({
  action,
  index,
  inView,
}: {
  action: (typeof AI_ACTIONS)[number]
  index: number
  inView: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.5 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ x: 3, backgroundColor: '#f0fdf9' }}
      className={[
        'flex cursor-default items-center gap-2.5 rounded-xl border p-3 transition-colors duration-150',
        action.done
          ? 'border-emerald-100 bg-emerald-50/60'
          : 'border-slate-100 bg-white',
      ].join(' ')}
    >
      <span
        className={[
          'grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-black',
          action.done
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-cyan-100 text-teal-900',
        ].join(' ')}
      >
        {action.done ? <CheckCircle2 size={13} /> : index + 1}
      </span>
      <span
        className={[
          'text-[12px] font-semibold',
          action.done ? 'text-emerald-700 line-through opacity-60' : 'text-slate-700',
        ].join(' ')}
      >
        {action.text}
      </span>
    </motion.div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const heroStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
}

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.65, ease: EASE },
  },
}

export function HeroSection() {
  const mockupRef = useRef(null)
  const mockupInView = useInView(mockupRef, { once: true, amount: 0.2 })

  return (
    <section
      id="producto"
      className="relative overflow-hidden px-5 pb-16 pt-28 lg:px-8 lg:pb-24 lg:pt-36"
    >
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(20,184,166,0.13),transparent)]"
      />

      <motion.div
        className="mx-auto max-w-7xl"
        variants={heroStagger}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={fadeUp} className="flex justify-center">
          <span className="ai-pulse inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-1.5 text-[13px] font-semibold text-teal-800 shadow-[0_4px_20px_rgba(20,184,166,0.15)]">
            <Sparkles size={14} className="text-teal-600" aria-hidden />
            CRM con IA, cotizaciones y alertas reales
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          variants={fadeUp}
          className="mx-auto mt-7 max-w-4xl text-balance text-center text-5xl font-black leading-[0.96] tracking-[-0.035em] text-teal-950 sm:text-6xl lg:text-[4.5rem]"
        >
          Tu equipo de ventas{' '}
          <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-400 bg-clip-text text-transparent">
            necesita claridad.
          </span>{' '}
          LeadFlow se la da.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="mx-auto mt-6 max-w-2xl text-center text-pretty text-base leading-8 text-slate-500 sm:text-lg"
        >
          Clientes, leads, pipeline, tareas, interacciones, cotizaciones, reportes y
          asistente IA — todo en un sistema que sabe qué hacer después.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp} className="mt-9 flex flex-wrap justify-center gap-3">
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/login"
              className="group inline-flex h-12 items-center gap-2.5 rounded-xl bg-teal-950 px-6 text-[15px] font-bold shadow-[0_8px_30px_rgba(4,47,46,0.28)] transition-colors duration-200 hover:bg-teal-800"
              style={{ color: 'white' }}
            >
              Comenzar gratis
              <ArrowRight
                size={17}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
            <a
              href="#soluciones"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-teal-200 bg-white px-6 text-[15px] font-semibold text-teal-900 shadow-sm transition-all duration-200 hover:border-teal-300 hover:shadow-md"
            >
              Ver el sistema
            </a>
          </motion.div>
        </motion.div>

        {/* Trust bar */}
        <motion.div
          variants={fadeUp}
          className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2"
        >
          {TRUST_ITEMS.map(({ icon, label }) => (
            <TrustPill key={label} icon={icon} label={label} />
          ))}
        </motion.div>

        {/* ── Mockup ── */}
        <motion.div variants={fadeUp} className="relative mx-auto mt-14 max-w-6xl">
          {/* Ambient glow */}
          <div
            aria-hidden
            className="landing-glow absolute -inset-8 rounded-[2.5rem] bg-[radial-gradient(circle_at_25%_25%,rgba(20,184,166,0.28),transparent_35%),radial-gradient(circle_at_75%_10%,rgba(125,211,252,0.2),transparent_30%)] blur-2xl"
          />

          <div
            ref={mockupRef}
            className="landing-float relative overflow-hidden rounded-[1.75rem] border border-teal-950/8 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.14)]"
          >
            {/* ── Mockup header ── */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-teal-600">
                  Pipeline en tiempo real
                </p>
                <h2 className="mt-0.5 text-base font-black text-teal-950">
                  Soluciones Ticas CRM
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                  <LiveDot />
                  Live
                </span>
                <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-bold text-teal-800">
                  Multiempresa
                </span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                  IVA 13%
                </span>
              </div>
            </div>

            <div className="grid bg-[#eef7f4] lg:grid-cols-[56px_1fr_290px]">
              {/* ── Sidebar ── */}
              <aside
                className="hidden border-r border-slate-100 bg-white py-5 lg:block"
                aria-label="Módulos de navegación"
              >
                <div className="flex flex-col items-center gap-4">
                  {SIDEBAR_ICONS.map((Icon, i) => (
                    <motion.span
                      key={i}
                      whileHover={i !== 0 ? { scale: 1.12, backgroundColor: '#f0fdfa' } : {}}
                      className={[
                        'grid size-9 cursor-default place-items-center rounded-xl transition-colors duration-150',
                        i === 0
                          ? 'bg-teal-950 text-cyan-300 shadow-[0_4px_12px_rgba(4,47,46,0.22)]'
                          : 'text-slate-400 hover:text-teal-700',
                      ].join(' ')}
                      aria-hidden
                    >
                      <Icon size={16} />
                    </motion.span>
                  ))}
                </div>
              </aside>

              {/* ── Pipeline board ── */}
              <div className="relative min-h-[440px] p-4 sm:p-5">
                {/* Flowing light line */}
                <div
                  aria-hidden
                  className="absolute left-5 right-5 top-1/2 hidden h-px overflow-hidden bg-teal-900/6 md:block"
                >
                  <span className="flow-light block h-px w-1/3 bg-gradient-to-r from-transparent via-teal-400 to-transparent" />
                </div>

                {/* Column headers with counts */}
                <div className="grid gap-3 md:grid-cols-3">
                  {(['Nuevo', 'Negociación', 'Cotización'] as const).map((col, i) => (
                    <motion.div
                      key={col}
                      initial={{ opacity: 0 }}
                      animate={mockupInView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.1 + i * 0.07 }}
                      className="flex items-center justify-between rounded-xl border border-white/70 bg-white/60 px-3 py-2 shadow-sm"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                        {col}
                      </span>
                      <span className="flex size-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500">
                        {i === 0 ? 3 : i === 1 ? 2 : 1}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Pipeline cards */}
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {PIPELINE_CARDS.map((card, i) => (
                    <PipelineCard key={card.title} card={card} index={i} inView={mockupInView} />
                  ))}
                </div>

                {/* Status cards */}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.18 }}
                    className="flex cursor-default items-center gap-3 rounded-2xl border border-teal-100 bg-white p-4"
                  >
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-950 text-cyan-300"
                      aria-hidden
                    >
                      <Fingerprint size={16} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Seguridad activa</p>
                      <p className="text-[11px] text-slate-500">JWT, bloqueo y auditoría</p>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.18 }}
                    className="flex cursor-default items-center gap-3 rounded-2xl border border-amber-100 bg-white p-4"
                  >
                    <motion.span
                      animate={{ rotate: [0, -8, 8, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                      className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700"
                      aria-hidden
                    >
                      <BellRing size={16} />
                    </motion.span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Alertas inteligentes</p>
                      <p className="text-[11px] text-slate-500">Tareas vencidas detectadas</p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* ── AI panel ── */}
              <aside
                className="border-t border-slate-100 bg-white p-5 lg:border-l lg:border-t-0"
                aria-label="Panel del asistente IA"
              >
                <div className="flex items-center gap-2.5">
                  <motion.span
                    animate={{ boxShadow: ['0 0 0 0 rgba(20,184,166,0)', '0 0 0 6px rgba(20,184,166,0.15)', '0 0 0 0 rgba(20,184,166,0)'] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="grid size-9 place-items-center rounded-xl bg-teal-950 text-cyan-300"
                    aria-hidden
                  >
                    <Bot size={17} />
                  </motion.span>
                  <div>
                    <p className="text-[13px] font-black text-teal-950">Asistente IA</p>
                    <p className="text-[11px] text-slate-500">Resumen accionable</p>
                  </div>
                </div>

                {/* AI insight */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={mockupInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.4 }}
                  className="mt-4 rounded-2xl border border-teal-100 bg-[#effaf6] p-4"
                >
                  <p className="text-[12px] leading-[1.65] text-slate-700">
                    La oportunidad de{' '}
                    <strong className="font-black text-teal-900">Distribuidora La Sabana</strong>{' '}
                    tiene alto valor y una cotización abierta. Conviene llamar hoy.
                  </p>
                </motion.div>

                {/* Action list */}
                <div className="mt-3 space-y-2">
                  {AI_ACTIONS.map((action, i) => (
                    <AIActionItem key={action.text} action={action} index={i} inView={mockupInView} />
                  ))}
                </div>

                {/* Score summary */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={mockupInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.8, duration: 0.4 }}
                  className="mt-4 grid grid-cols-2 gap-2"
                >
                  <div className="rounded-xl bg-[#f0faf6] p-3">
                    <p className="text-[10px] font-semibold text-slate-400">Score</p>
                    <p className="mt-0.5 text-sm font-black text-teal-950">70 / 100</p>
                  </div>
                  <div className="rounded-xl bg-[#f0faf6] p-3">
                    <p className="text-[10px] font-semibold text-slate-400">Prob. cierre</p>
                    <p className="mt-0.5 text-sm font-black text-emerald-700">75%</p>
                  </div>
                </motion.div>
              </aside>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
