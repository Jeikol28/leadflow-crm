import { useProductivityReport } from './useReports'
import { KpiCard, KpiGrid, ReportState, SectionCard } from './ReportPrimitives'
import { formatCurrency } from '../../shared/utils/format'

export function ProductivityReportSection({ from, to }: { from: string; to: string }) {
  const { data, isLoading, error } = useProductivityReport(from, to, true)

  if (isLoading || error) return <ReportState isLoading={isLoading} error={error} />
  if (!data) return null

  return (
    <div className="space-y-6">
      <KpiGrid>
        <KpiCard label="Usuarios activos" value={String(data.activeUsers)} />
        <KpiCard label="Interacciones" value={String(data.totalInteractions)} />
        <KpiCard label="Tareas completadas" value={String(data.totalCompletedTasks)} />
        <KpiCard label="Tareas vencidas" value={String(data.totalOverdueTasks)} />
      </KpiGrid>

      <SectionCard title="Productividad por usuario">
        {data.users.length === 0 ? (
          <p className="text-sm text-slate-400">Sin actividad en este período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Productividad por usuario">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                  <th className="py-2 pr-4">Usuario</th>
                  <th className="py-2 pr-4 text-right">Leads</th>
                  <th className="py-2 pr-4 text-right">Ganados</th>
                  <th className="py-2 pr-4 text-right">Tareas ✓</th>
                  <th className="py-2 pr-4 text-right">Vencidas</th>
                  <th className="py-2 pr-4 text-right">Interac.</th>
                  <th className="py-2 pr-4 text-right">Cotiz.</th>
                  <th className="py-2 text-right">Vendido</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user.userId} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 pr-4">
                      <p className="text-sm font-semibold text-slate-800">{user.fullName}</p>
                      <p className="text-xs text-slate-400">{user.role}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-right text-sm text-slate-600">{user.assignedLeads}</td>
                    <td className="py-2.5 pr-4 text-right text-sm text-slate-600">{user.wonLeads}</td>
                    <td className="py-2.5 pr-4 text-right text-sm text-slate-600">{user.completedTasks}</td>
                    <td className={`py-2.5 pr-4 text-right text-sm ${user.overdueTasks > 0 ? 'font-black text-red-600' : 'text-slate-600'}`}>
                      {user.overdueTasks}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-sm text-slate-600">{user.interactions}</td>
                    <td className="py-2.5 pr-4 text-right text-sm text-slate-600">{user.quotesCreated}</td>
                    <td className="py-2.5 text-right text-sm font-black text-teal-700">{formatCurrency(user.acceptedAmount)}</td>
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
