import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../app/providers/AuthProvider'
import { hasAnyRole, ROLES } from '../../shared/auth/roles'
import { formatCurrency, formatRelativeTime } from '../../shared/utils/format'
import { MetricsGrid } from './components/MetricsGrid'
import { PipelineSnapshot } from './components/PipelineSnapshot'
import { RevenueChart } from './components/RevenueChart'
import { ActivityFeed } from './components/ActivityFeed'
import { TasksList } from './components/TasksList'
import { QuotesTable } from './components/QuotesTable'
import { AlertsPanel } from './components/AlertsPanel'
import { AIInsightCard } from './components/AIInsightCard'
import { OnboardingCard } from './components/OnboardingCard'
import { useDashboardSummary } from './useDashboardSummary'
import type { DashboardSummary, Metric, PipelineStage } from './dashboard.types'

function PageHeader({
  name,
  updatedLabel,
  isRefreshing,
  onRefresh,
  onNewQuote,
  onNewLead,
}: {
  name: string
  updatedLabel: string
  isRefreshing: boolean
  onRefresh: () => void
  onNewQuote: () => void
  onNewLead: () => void
}) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  const today = new Date().toLocaleDateString('es-CR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.1em] text-teal-600">Dashboard</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-teal-950">
          {greeting}, {name}
        </h1>
        <p className="mt-1 text-sm capitalize text-slate-500">
          {today}
          {updatedLabel ? <span className="normal-case text-slate-400"> · Actualizado {updatedLabel}</span> : null}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-9 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-900 disabled:opacity-60"
        >
          {isRefreshing ? 'Actualizando…' : 'Actualizar'}
        </button>
        <button
          onClick={onNewQuote}
          className="h-9 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-900"
        >
          Nueva cotización
        </button>
        <button
          onClick={onNewLead}
          className="h-9 rounded-xl bg-teal-950 px-4 text-sm font-black text-white shadow-[0_4px_14px_rgba(4,47,46,0.2)] transition-colors hover:bg-teal-800"
        >
          + Nuevo lead
        </button>
      </div>
    </div>
  )
}

// Convierte el resumen real del backend en las tarjetas de KPI del dashboard.
function buildMetrics(summary: DashboardSummary): Metric[] {
  return [
    { id: 'revenue',    label: 'Ingresos del mes',     value: formatCurrency(summary.currentMonthAcceptedQuotesAmount), trend: 'neutral', trendValue: '—', hint: 'Cotizaciones aceptadas' },
    { id: 'leads',      label: 'Leads activos',         value: String(summary.activeLeads),                              trend: 'neutral', trendValue: '—', hint: 'En seguimiento' },
    { id: 'conversion', label: 'Tasa de conversión',    value: `${Math.round(summary.conversionRate)}%`,                 trend: 'neutral', trendValue: '—', hint: 'Leads ganados' },
    { id: 'quotes',     label: 'Cotizaciones abiertas', value: String(summary.quotesDraft + summary.quotesSent),         trend: 'neutral', trendValue: '—', hint: 'Borrador + enviadas' },
    { id: 'tasks',      label: 'Tareas vencidas',       value: String(summary.overdueTasks),                             trend: summary.overdueTasks > 0 ? 'down' : 'neutral', trendValue: '—', hint: 'Requieren atención' },
    { id: 'pipeline',   label: 'Pipeline total',        value: formatCurrency(summary.openPipelineAmount),               trend: 'neutral', trendValue: '—', hint: `${summary.activeLeads} oportunidades` },
  ]
}

const PIPELINE_COLORS = [
  'bg-sky-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-purple-500',
]

// Convierte los leads agrupados por estado en las barras del pipeline.
function buildPipelineStages(summary: DashboardSummary): PipelineStage[] {
  return summary.leadsByStatus.map((group, index) => {
    const color = PIPELINE_COLORS[index % PIPELINE_COLORS.length]
    return {
      name: group.name,
      count: group.count,
      amount: group.amount,
      value: formatCurrency(group.amount),
      barColor: color,
      dotColor: color,
    }
  })
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-[140px] animate-pulse rounded-2xl border border-slate-200/70 bg-white"
        />
      ))}
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const firstName = user?.fullName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Usuario'
  const canViewReports = hasAnyRole(user?.role, [ROLES.AdminEmpresa, ROLES.Gerente])

  const { data, isLoading, isFetching, error, updatedAt } = useDashboardSummary()
  const updatedLabel = data && updatedAt ? formatRelativeTime(updatedAt) : ''

  // Refresca todas las consultas activas del dashboard.
  function handleRefresh() {
    void queryClient.invalidateQueries()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        name={firstName}
        updatedLabel={updatedLabel}
        isRefreshing={isFetching}
        onRefresh={handleRefresh}
        onNewQuote={() => navigate({ to: '/app/quotes' })}
        onNewLead={() => navigate({ to: '/app/leads' })}
      />

      {/* Onboarding — se muestra solo si la empresa aún no completó su configuración */}
      <OnboardingCard />

      {/* KPIs — datos reales del backend */}
      {isLoading && <MetricsSkeleton />}
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 px-5 py-4">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
          <button
            onClick={handleRefresh}
            className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-black text-rose-700 transition-colors hover:bg-rose-50"
          >
            Reintentar
          </button>
        </div>
      )}
      {data && <MetricsGrid metrics={buildMetrics(data)} />}

      {/* Gráfico de ventas + IA — solo Admin/Gerente ven el gráfico */}
      {canViewReports && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <AIInsightCard />
        </div>
      )}

      {/* Pipeline — datos reales (leadsByStatus) */}
      {data && <PipelineSnapshot stages={buildPipelineStages(data)} />}

      {/* Actividad, tareas y alertas — datos reales */}
      {data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ActivityFeed interactions={data.recentInteractions} />
          <div className="space-y-6">
            <TasksList tasks={data.upcomingTasks} />
            <AlertsPanel />
            {/* Para Vendedor/Soporte (sin gráfico arriba) mostramos la IA aquí */}
            {!canViewReports && <AIInsightCard />}
          </div>
        </div>
      )}

      {/* Cotizaciones recientes — datos reales */}
      <QuotesTable />
    </div>
  )
}
