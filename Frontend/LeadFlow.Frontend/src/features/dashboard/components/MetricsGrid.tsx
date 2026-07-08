import { useRef } from 'react'
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Clock,
  DollarSign,
  FileText,
  Minus,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { Metric, MetricId, TrendDirection } from '../dashboard.types'


const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: EASE } },
}

type IconConfig = { icon: LucideIcon; iconBg: string; iconColor: string }

const ICON_MAP: Record<MetricId, IconConfig> = {
  revenue:    { icon: DollarSign, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  leads:      { icon: Users,      iconBg: 'bg-sky-50',     iconColor: 'text-sky-600'     },
  conversion: { icon: TrendingUp, iconBg: 'bg-indigo-50',  iconColor: 'text-indigo-600'  },
  quotes:     { icon: FileText,   iconBg: 'bg-teal-50',    iconColor: 'text-teal-600'    },
  tasks:      { icon: Clock,      iconBg: 'bg-amber-50',   iconColor: 'text-amber-600'   },
  pipeline:   { icon: BarChart3,  iconBg: 'bg-purple-50',  iconColor: 'text-purple-600'  },
}

const TREND_CONFIG: Record<TrendDirection, { icon: LucideIcon; color: string }> = {
  up:      { icon: ArrowUp,   color: 'text-emerald-600' },
  down:    { icon: ArrowDown, color: 'text-red-500'     },
  neutral: { icon: Minus,     color: 'text-slate-400'   },
}

function MetricCard({ metric }: { metric: Metric }) {
  const config = ICON_MAP[metric.id]
  const trendConf = TREND_CONFIG[metric.trend]
  const Icon = config.icon
  const TrendIcon = trendConf.icon

  return (
    <motion.article
      variants={cardVariants}
      whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
      className="flex flex-col rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_16px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_8px_32px_rgba(15,23,42,0.1)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`grid size-10 place-items-center rounded-xl ${config.iconBg} ${config.iconColor}`}
          aria-hidden
        >
          <Icon size={19} />
        </span>
        <span className={`flex items-center gap-1 text-[11px] font-black ${trendConf.color}`}>
          <TrendIcon size={11} aria-hidden />
          {metric.trendValue}
        </span>
      </div>
      <p className="mt-4 text-2xl font-black tracking-tight text-teal-950">{metric.value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{metric.label}</p>
      <p className="mt-1 text-xs text-slate-400">{metric.hint}</p>
    </motion.article>
  )
}

export function MetricsGrid({ metrics }: { metrics: Metric[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.1 })

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6"
    >
      {metrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </motion.div>
  )
}
