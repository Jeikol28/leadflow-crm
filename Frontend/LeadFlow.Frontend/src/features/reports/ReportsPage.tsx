import { useState } from 'react'
import { RequireRole } from '../../app/routes/RequireRole'
import { ROLES } from '../../shared/auth/roles'
import { SalesReportSection } from './SalesReportSection'
import { PipelineReportSection } from './PipelineReportSection'
import { ProductivityReportSection } from './ProductivityReportSection'
import { CustomersReportSection } from './CustomersReportSection'

type Tab = 'sales' | 'pipeline' | 'productivity' | 'customers'

const TABS: { id: Tab; label: string }[] = [
  { id: 'sales', label: 'Ventas' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'productivity', label: 'Productividad' },
  { id: 'customers', label: 'Clientes' },
]

function firstDayOfMonth(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

const dateInputClass =
  'h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-teal-500'

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('sales')
  const [from, setFrom] = useState(firstDayOfMonth())
  const [to, setTo] = useState(today())

  return (
    <RequireRole allowedRoles={[ROLES.AdminEmpresa, ROLES.Gerente]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-teal-600">Análisis</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-teal-950">Reportes</h1>
          <p className="mt-1 text-sm text-slate-500">Indicadores gerenciales de la empresa.</p>
        </div>

        {/* Controles: pestañas + rango de fechas */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-black transition-colors ${
                  tab === item.id ? 'bg-teal-950 text-white' : 'text-slate-500 hover:text-teal-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab !== 'pipeline' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className={dateInputClass}
                aria-label="Desde"
              />
              <span className="text-slate-400">—</span>
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className={dateInputClass}
                aria-label="Hasta"
              />
            </div>
          )}
        </div>

        {/* Contenido según pestaña */}
        {tab === 'sales' && <SalesReportSection from={from} to={to} />}
        {tab === 'pipeline' && <PipelineReportSection />}
        {tab === 'productivity' && <ProductivityReportSection from={from} to={to} />}
        {tab === 'customers' && <CustomersReportSection from={from} to={to} />}
      </div>
    </RequireRole>
  )
}
