import { useEffect, useRef, useState } from 'react'
import { BellRing, LineChart as LineChartIcon, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { useInView } from 'framer-motion'
import { Reveal } from '../../../shared/components/motion/Reveal'

const SPARKLINE_DATA = [
  { mes: 'Ene', valor: 28 },
  { mes: 'Feb', valor: 35 },
  { mes: 'Mar', valor: 31 },
  { mes: 'Abr', valor: 44 },
  { mes: 'May', valor: 40 },
  { mes: 'Jun', valor: 50 },
]

type Metric = { label: string; value: string; helper: string; numeric: number; suffix: string; prefix: string }

const METRICS: Metric[] = [
  { label: 'Conversión',      value: '50%',       helper: 'Leads ganados vs activos',  numeric: 50,   suffix: '%',  prefix: ''     },
  { label: 'Pipeline abierto', value: 'CRC 2.2M', helper: 'Oportunidades vivas',       numeric: 2.2,  suffix: 'M', prefix: 'CRC ' },
  { label: 'Cotizaciones',    value: 'CRC 536K',  helper: 'Monto abierto',             numeric: 536,  suffix: 'K', prefix: 'CRC ' },
  { label: 'Alertas activas', value: '1 crítica', helper: 'Acción prioritaria hoy',    numeric: 1,    suffix: ' crítica', prefix: '' },
]

function AnimatedNumber({ metric, trigger }: { metric: Metric; trigger: boolean }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!trigger) return
    let start = 0
    const end = metric.numeric
    const duration = 1400
    const step = 16
    const increment = (end / (duration / step))

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(parseFloat(start.toFixed(1)))
      }
    }, step)

    return () => clearInterval(timer)
  }, [trigger, metric.numeric])

  const display = Number.isInteger(metric.numeric)
    ? Math.round(count).toString()
    : count.toFixed(1)

  return (
    <span>
      {metric.prefix}
      {trigger ? display : '0'}
      {metric.suffix}
    </span>
  )
}

export function ReportsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section id="reportes" className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl" ref={ref}>
        <Reveal>
          <div className="overflow-hidden rounded-[1.75rem] border border-teal-950/8 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.07)]">
            {/* Header */}
            <div className="border-b border-slate-100 px-6 py-6 lg:px-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.1em] text-teal-600">
                    Reportes y control
                  </p>
                  <h2 className="mt-2 max-w-xl text-balance text-4xl font-black tracking-[-0.03em] text-teal-950 lg:text-5xl">
                    Números que explican dónde está la venta.
                  </h2>
                </div>
                <div className="flex gap-3">
                  <div className="rounded-2xl bg-[#f0faf6] px-4 py-3">
                    <LineChartIcon className="text-teal-600" size={20} aria-hidden />
                    <p className="mt-2 text-sm font-black text-teal-950">Pipeline ponderado</p>
                  </div>
                  <div className="rounded-2xl bg-[#fff8e8] px-4 py-3">
                    <BellRing className="text-amber-600" size={20} aria-hidden />
                    <p className="mt-2 text-sm font-black text-amber-900">Alertas críticas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sparkline chart */}
            <div className="border-b border-slate-100 px-6 py-5 lg:px-8">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <TrendingUp size={16} className="text-teal-600" aria-hidden />
                Tasa de conversión — últimos 6 meses
              </div>
              <div className="mt-4 h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SPARKLINE_DATA} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="mes"
                      tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ background: '#042f2e', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12 }}
                      formatter={(v) => [typeof v === 'number' ? `${v}%` : String(v), 'Conversión']}
                    />
                    <Area
                      type="monotone"
                      dataKey="valor"
                      stroke="#0d9488"
                      strokeWidth={2.5}
                      fill="url(#convGradient)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
              {METRICS.map((metric, i) => (
                <Reveal key={metric.label} delay={i * 80}>
                  <div className="bg-white px-6 py-6">
                    <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                    <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-teal-950">
                      <AnimatedNumber metric={metric} trigger={inView} />
                    </p>
                    <p className="mt-1.5 text-xs text-slate-400">{metric.helper}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
