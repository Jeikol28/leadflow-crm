import { useCustomerReport } from './useReports'
import { BarList, KpiCard, KpiGrid, ReportState, SectionCard } from './ReportPrimitives'
import { formatCurrency } from '../../shared/utils/format'

export function CustomersReportSection({ from, to }: { from: string; to: string }) {
  const { data, isLoading, error } = useCustomerReport(from, to, true)

  if (isLoading || error) return <ReportState isLoading={isLoading} error={error} />
  if (!data) return null

  return (
    <div className="space-y-6">
      <KpiGrid>
        <KpiCard label="Clientes totales" value={String(data.totalCustomers)} />
        <KpiCard label="Nuevos" value={String(data.newCustomers)} hint="En el período" />
        <KpiCard label="Con leads abiertos" value={String(data.customersWithOpenLeads)} />
        <KpiCard label="Con ventas" value={String(data.customersWithAcceptedQuotes)} hint="Cotizaciones aceptadas" />
      </KpiGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Por origen">
          <BarList items={data.customersBySource} metric="count" />
        </SectionCard>
        <SectionCard title="Por provincia">
          <BarList items={data.customersByProvince} metric="count" />
        </SectionCard>
      </div>

      <SectionCard title="Clientes destacados">
        {data.topCustomers.length === 0 ? (
          <p className="text-sm text-slate-400">Sin datos en este período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Clientes destacados">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                  <th className="py-2 pr-4">Cliente</th>
                  <th className="py-2 pr-4 text-right">Leads</th>
                  <th className="py-2 pr-4 text-right">Cotiz.</th>
                  <th className="py-2 pr-4 text-right">Potencial</th>
                  <th className="py-2 text-right">Vendido</th>
                </tr>
              </thead>
              <tbody>
                {data.topCustomers.map((customer) => (
                  <tr key={customer.customerId} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 pr-4 text-sm font-semibold text-slate-800">{customer.customerName}</td>
                    <td className="py-2.5 pr-4 text-right text-sm text-slate-600">{customer.leadsCount}</td>
                    <td className="py-2.5 pr-4 text-right text-sm text-slate-600">{customer.quotesCount}</td>
                    <td className="py-2.5 pr-4 text-right text-sm text-slate-600">{formatCurrency(customer.potentialAmount)}</td>
                    <td className="py-2.5 text-right text-sm font-black text-teal-700">{formatCurrency(customer.acceptedAmount)}</td>
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
