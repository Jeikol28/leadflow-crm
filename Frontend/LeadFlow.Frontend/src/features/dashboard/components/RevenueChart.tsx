import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../../../app/providers/AuthProvider'
import { hasAnyRole, ROLES } from '../../../shared/auth/roles'
import { useSalesReport } from '../useSalesReport'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatCRC(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  return `${(value / 1_000).toFixed(0)}K`
}

export function RevenueChart() {
  const { user } = useAuth()
  const canViewReports = hasAnyRole(user?.role, [ROLES.AdminEmpresa, ROLES.Gerente])
  const { data, isLoading, error } = useSalesReport(canViewReports)

  const chartData = (data?.salesByMonth ?? []).map((point) => ({
    mes: MONTHS[point.month - 1] ?? String(point.month),
    cotizado: point.quotedAmount,
    aceptado: point.acceptedAmount,
  }))

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-teal-950">Ventas por mes</h2>
          <p className="mt-0.5 text-sm text-slate-500">Cotizado vs aceptado</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-teal-600">
            <span className="inline-block size-2.5 rounded-full bg-teal-500" aria-hidden />
            Aceptado
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="inline-block size-2.5 rounded-full bg-slate-300" aria-hidden />
            Cotizado
          </span>
        </div>
      </div>

      {!canViewReports && (
        <div className="mt-6 grid h-44 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center">
          <p className="max-w-xs text-sm text-slate-500">
            El reporte de ventas está disponible para administradores y gerentes.
          </p>
        </div>
      )}

      {canViewReports && isLoading && (
        <div className="mt-6 h-44 animate-pulse rounded-xl bg-slate-100" />
      )}

      {canViewReports && error && (
        <p className="mt-6 text-sm font-semibold text-rose-600">{error}</p>
      )}

      {canViewReports && !isLoading && !error && chartData.length === 0 && (
        <div className="mt-6 grid h-44 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center">
          <p className="text-sm text-slate-500">Aún no hay ventas registradas en el período.</p>
        </div>
      )}

      {canViewReports && chartData.length > 0 && (
        <div className="mt-6 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="aceptadoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cotizadoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => (typeof v === 'number' ? formatCRC(v) : String(v))}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={{
                  background: '#042f2e',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 12,
                  padding: '8px 12px',
                }}
                formatter={(v, name) => [
                  `CRC ${typeof v === 'number' ? formatCRC(v) : String(v)}`,
                  name,
                ]}
              />
              <Area
                type="monotone"
                dataKey="aceptado"
                stroke="#0d9488"
                strokeWidth={2.5}
                fill="url(#aceptadoGrad)"
                dot={false}
                name="Aceptado"
              />
              <Area
                type="monotone"
                dataKey="cotizado"
                stroke="#cbd5e1"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="url(#cotizadoGrad)"
                dot={false}
                name="Cotizado"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}