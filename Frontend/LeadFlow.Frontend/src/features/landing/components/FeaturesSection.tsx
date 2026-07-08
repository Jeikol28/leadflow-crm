import {
  BarChart3,
  Clock3,
  FileCheck2,
  MessageSquareText,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion, useInView, type Variants } from 'framer-motion'
import { useRef } from 'react'
import { Reveal } from '../../../shared/components/motion/Reveal'

type Feature = {
  icon: LucideIcon
  title: string
  text: string
  iconBg: string
  iconColor: string
  size?: 'default' | 'wide'
}

const FEATURES: Feature[] = [
  {
    icon: UsersRound,
    title: 'Clientes y oportunidades',
    text: 'Centraliza clientes, leads, valores estimados, estados y responsables. Visión completa del ciclo comercial de cada empresa.',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-700',
    size: 'wide',
  },
  {
    icon: Clock3,
    title: 'Tareas y seguimientos',
    text: 'Programa acciones, detecta vencimientos y evita que una oportunidad quede sin seguimiento.',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
  },
  {
    icon: MessageSquareText,
    title: 'Historial comercial',
    text: 'Registra llamadas, WhatsApp, correos y reuniones para entender cada relación.',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-700',
  },
  {
    icon: FileCheck2,
    title: 'Cotizaciones profesionales',
    text: 'Propuestas con servicios, descuentos, IVA 13%, PDF, estado y trazabilidad completa.',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    size: 'wide',
  },
  {
    icon: BarChart3,
    title: 'Reportes ejecutivos',
    text: 'Mide conversión, pipeline, ventas y rendimiento comercial en tiempo real.',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-700',
  },
  {
    icon: ShieldCheck,
    title: 'Seguridad multiempresa',
    text: 'La información de cada empresa está protegida y separada, con permisos por rol y control de acceso.',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
]

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(4px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, delay: i * 0.07, ease: EASE },
  }),
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <motion.article
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      custom={index}
      whileHover={{ y: -5, transition: { duration: 0.22, ease: 'easeOut' } }}
      className={[
        'group flex flex-col rounded-3xl border border-teal-950/8 bg-white p-7 shadow-[0_4px_24px_rgba(15,23,42,0.05)]',
        'transition-shadow duration-300 hover:shadow-[0_12px_48px_rgba(15,23,42,0.1)]',
        feature.size === 'wide' ? 'md:col-span-2' : '',
      ].join(' ')}
    >
      <span
        className={`grid size-12 place-items-center rounded-2xl ${feature.iconBg} ${feature.iconColor} transition-transform duration-300 group-hover:scale-110`}
        aria-hidden
      >
        <Icon size={22} />
      </span>
      <h3 className="mt-6 text-xl font-black text-slate-900">{feature.title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-500">{feature.text}</p>
    </motion.article>
  )
}

export function FeaturesSection() {
  return (
    <section id="soluciones" className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-teal-600">
              Sistema comercial completo
            </p>
            <h2 className="mt-3 text-balance text-4xl font-black tracking-[-0.03em] text-teal-950 lg:text-5xl">
              Un flujo comercial completo, claro y accionable.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-500">
              Todo lo que necesita un equipo de ventas en un solo lugar, sin saltar entre herramientas.
            </p>
          </div>
        </Reveal>

        {/* Bento grid: 3-column, wide cards span 2 */}
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}