import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useSalesReport } from './useReports'
import { BarList, KpiCard, KpiGrid, ReportState, SectionCard } from './ReportPrimitives'
import { formatCurrency, formatShortDate } from '../../shared/utils/format'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function axisMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  return `${(value / 1_000).toFixed(0)}K`
}

export function SalesReportSection({ from, to }: { from: string; to: string }) {
  const { data, isLoading, error } = useSalesReport(from, to, true)

  if (isLoading || error) return <ReportState isLoading={isLoading} error={error} />
  if (!data) return null

  const chartData = data.salesByMonth.map((point) => ({
    mes: MONTHS[point.month - 1] ?? String(point.month),
    cotizado: point.quotedAmount,
    aceptado: point.acceptedAmount,
  }))

  return (
    <div className="space-y-6">
      <KpiGrid>
        <KpiCard label="Total cotizado" value={formatCurrency(data.totalQuotedAmount)} hint={`${data.totalQuotes} cotizaciones`} />
        <KpiCard label="Aceptado" value={formatCurrency(data.acceptedAmount)} hint={`${data.acceptedQuotes} aceptadas`} />
        <KpiCard label="Tasa de aceptación" value={`${Math.round(data.acceptanceRate)}%`} />
        <KpiCard label="Ticket promedio" value={formatCurrency(data.averageQuoteAmount)} />
      </KpiGrid>

      <SectionCard title="Ventas por mes — cotizado vs aceptado">
        {chartData.length === 0 ? (
          <p className="text-sm text-slate-400">Sin datos en este período.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="repAceptado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => (typeof v === 'number' ? axisMoney(v) : String(v))}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  contentStyle={{ background: '#042f2e', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12, padding: '8px 12px' }}
                  formatter={(v, name) => [`CRC ${typeof v === 'number' ? axisMoney(v) : String(v)}`, name]}
                />
                <Area type="monotone" dataKey="aceptado" stroke="#0d9488" strokeWidth={2.5} fill="url(#repAceptado)" dot={false} name="Aceptado" />
                <Area type="monotone" dataKey="cotizado" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 3" fill="transparent" dot={false} name="Cotizado" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Cotizaciones por estado">
          <BarList items={data.quotesByStatus} metric="count" />
        </SectionCard>

        <SectionCard title="Mejores cotizaciones aceptadas">
          {data.topAcceptedQuotes.length === 0 ? (
            <p className="text-sm text-slate-400">Sin cotizaciones aceptadas en este período.</p>
          ) : (
            <ul className="divide-y divide-slate-100" role="list">
              {data.topAcceptedQuotes.map((quote) => (
                <li key={quote.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{quote.customerName}</p>
                    <p className="text-xs text-slate-400">
                      {quote.quoteNumber} · {formatShortDate(quote.issueDate)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-black text-teal-700">{formatCurrency(quote.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
