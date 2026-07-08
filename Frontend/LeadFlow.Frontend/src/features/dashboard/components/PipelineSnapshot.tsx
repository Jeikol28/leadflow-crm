import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { PipelineStage } from '../dashboard.types'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
}

function formatCRC(amount: number): string {
  if (amount >= 1_000_000) return `CRC ${(amount / 1_000_000).toFixed(1)}M`
  return `CRC ${(amount / 1_000).toFixed(0)}K`
}

export function PipelineSnapshot({ stages }: { stages: PipelineStage[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  const totalAmount = stages.reduce((sum, s) => sum + s.amount, 0)
  const totalCount = stages.reduce((sum, s) => sum + s.count, 0)
  const maxAmount = Math.max(...stages.map((s) => s.amount), 1)

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-teal-950">Pipeline comercial</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {totalCount} oportunidades activas · {formatCRC(totalAmount)} total
          </p>
        </div>
        <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">
          {stages.length} etapa{stages.length === 1 ? '' : 's'}
        </span>
      </div>

      {stages.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">
          Aún no hay leads en el pipeline.
        </p>
      ) : (
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mt-6 space-y-4"
        >
          {stages.map((stage, idx) => {
            const pct = Math.round((stage.amount / maxAmount) * 100)
            return (
              <motion.div key={stage.name} variants={rowVariants}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`grid size-6 place-items-center rounded-lg text-[10px] font-black text-white ${stage.barColor}`}
                    >
                      {stage.count}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{stage.name}</span>
                  </div>
                  <span className="text-sm font-black text-teal-950">{stage.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className={`h-full rounded-full ${stage.barColor}`}
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${pct}%` } : {}}
                    transition={{ duration: 0.9, delay: 0.3 + idx * 0.1, ease: EASE }}
                  />
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </section>
  )
}