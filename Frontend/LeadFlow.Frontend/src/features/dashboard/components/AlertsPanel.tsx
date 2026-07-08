import { AlertTriangle, Info, XOctagon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAlerts } from '../useAlerts'
import type { CrmAlert } from '../alerts.types'

type SeverityStyle = {
  icon: LucideIcon
  border: string
  bg: string
  iconColor: string
  titleColor: string
}

const DANGER: SeverityStyle = {
  icon: XOctagon,
  border: 'border-red-200',
  bg: 'bg-red-50/60',
  iconColor: 'text-red-500',
  titleColor: 'text-red-800',
}
const WARNING: SeverityStyle = {
  icon: AlertTriangle,
  border: 'border-amber-200',
  bg: 'bg-amber-50/60',
  iconColor: 'text-amber-500',
  titleColor: 'text-amber-800',
}
const INFO: SeverityStyle = {
  icon: Info,
  border: 'border-sky-200',
  bg: 'bg-sky-50/60',
  iconColor: 'text-sky-500',
  titleColor: 'text-sky-800',
}

// Mapea la severidad del backend (Critical/High/Medium/Low) a un estilo visual.
function styleForSeverity(severity: string): SeverityStyle {
  if (severity === 'Critical') return DANGER
  if (severity === 'High') return WARNING
  return INFO
}

function AlertCard({ alert }: { alert: CrmAlert }) {
  const conf = styleForSeverity(alert.severity)
  const Icon = conf.icon

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${conf.border} ${conf.bg}`}>
      <Icon size={16} className={`mt-0.5 shrink-0 ${conf.iconColor}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-black ${conf.titleColor}`}>{alert.title}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-600">{alert.message}</p>
      </div>
    </div>
  )
}

export function AlertsPanel() {
  const { data, isLoading, error } = useAlerts()

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-teal-950">Alertas inteligentes</h2>
          <p className="mt-0.5 text-sm text-slate-500">Requieren tu atención</p>
        </div>
        {data && data.total > 0 && (
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-black text-teal-700">
            {data.total}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {isLoading && (
          <>
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
          </>
        )}

        {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}

        {data && !isLoading && data.alerts.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
            No hay alertas activas. Todo bajo control.
          </p>
        )}

        {data && data.alerts.map((alert) => <AlertCard key={alert.alertId} alert={alert} />)}
      </div>
    </section>
  )
}