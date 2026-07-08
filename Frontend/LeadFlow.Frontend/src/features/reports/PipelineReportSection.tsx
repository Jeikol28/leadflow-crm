import { usePipelineReport } from './useReports'
import { BarList, KpiCard, KpiGrid, ReportState, SectionCard } from './ReportPrimitives'
import { formatCurrency, formatShortDate } from '../../shared/utils/format'

export function PipelineReportSection() {
  const { data, isLoading, error } = usePipelineReport(true)

  if (isLoading || error) return <ReportState isLoading={isLoading} error={error} />
  if (!data) return null

  return (
    <div className="space-y-6">
      <KpiGrid>
        <KpiCard label="Leads totales" value={String(data.totalLeads)} hint={`${data.openLeads} abiertos`} />
        <KpiCard label="Ganados" value={String(data.wonLeads)} hint={`${data.lostLeads} perdidos`} />
        <KpiCard label="Tasa de cierre" value={`${Math.round(data.winRate)}%`} />
        <KpiCard label="Pipeline abierto" value={formatCurrency(data.openPipelineAmount)} hint={`Ponderado ${formatCurrency(data.weightedPipelineAmount)}`} />
      </KpiGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Por estado">
          <BarList items={data.leadsByStatus} metric="count" />
        </SectionCard>
        <SectionCard title="Por prioridad">
          <BarList items={data.leadsByPriority} metric="count" />
        </SectionCard>
        <SectionCard title="Por temperatura">
          <BarList items={data.leadsByTemperature} metric="count" />
        </SectionCard>
      </div>

      <SectionCard title="Próximos cierres">
        {data.upcomingCloseLeads.length === 0 ? (
          <p className="text-sm text-slate-400">No hay cierres próximos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Próximos cierres">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                  <th className="py-2 pr-4">Oportunidad</th>
                  <th className="py-2 pr-4">Prob.</th>
                  <th className="py-2 pr-4 text-right">Monto</th>
                  <th className="py-2 text-right">Cierre</th>
                </tr>
              </thead>
              <tbody>
                {data.upcomingCloseLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 pr-4">
                      <p className="text-sm font-semibold text-slate-800">{lead.title}</p>
                      <p className="text-xs text-slate-400">{lead.customerName}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-sm text-slate-600">{lead.closeProbability}%</td>
                    <td className="py-2.5 pr-4 text-right text-sm font-black text-slate-900">
                      {lead.estimatedAmount != null ? formatCurrency(lead.estimatedAmount) : '—'}
                    </td>
                    <td className="py-2.5 text-right text-sm text-slate-500">{formatShortDate(lead.expectedCloseDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
