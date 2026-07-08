import type { ReactNode } from 'react'
import type { ReportGroup } from './reports.types'

export function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
      <p className="text-2xl font-black tracking-tight text-teal-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{children}</div>
}

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
      <h2 className="text-base font-black text-teal-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

// Barras horizontales para distribuciones {name, count, amount}.
export function BarList({
  items,
  metric = 'count',
  formatValue,
}: {
  items: ReportGroup[]
  metric?: 'count' | 'amount'
  formatValue?: (value: number) => string
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">Sin datos en este período.</p>
  }
  const values = items.map((item) => (metric === 'amount' ? item.amount : item.count))
  const max = Math.max(...values, 1)

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const value = metric === 'amount' ? item.amount : item.count
        const pct = Math.round((value / max) * 100)
        return (
          <div key={item.name}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-semibold text-slate-700">{item.name}</span>
              <span className="font-black text-teal-950">{formatValue ? formatValue(value) : value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ReportState({ isLoading, error }: { isLoading: boolean; error: string | null }) {
  if (isLoading) {
    return <p className="py-16 text-center text-sm text-slate-400">Cargando reporte…</p>
  }
  if (error) {
    return <p className="py-16 text-center text-sm font-semibold text-rose-600">{error}</p>
  }
  return null
}
