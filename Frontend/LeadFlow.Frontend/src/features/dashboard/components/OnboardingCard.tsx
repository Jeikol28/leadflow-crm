import { useNavigate } from '@tanstack/react-router'
import { useOnboardingStatus } from '../useOnboardingStatus'

// Lleva al usuario al módulo del siguiente paso pendiente (usa rutas existentes).
function navigateToModule(navigate: ReturnType<typeof useNavigate>, module: string) {
  const m = module.toLowerCase()
  if (m.includes('client') || m.includes('customer')) return navigate({ to: '/app/customers' })
  if (m.includes('lead') || m.includes('pipeline')) return navigate({ to: '/app/leads' })
  if (m.includes('task') || m.includes('tarea')) return navigate({ to: '/app/tasks' })
  if (m.includes('quote') || m.includes('cotiz')) return navigate({ to: '/app/quotes' })
  return navigate({ to: '/app/settings' })
}

export function OnboardingCard() {
  const navigate = useNavigate()
  const { data } = useOnboardingStatus()

  // No mostramos nada mientras carga, si falla, o si ya está completo.
  if (!data || data.isComplete) {
    return null
  }

  const nextStep = data.steps.find((step) => !step.isCompleted)

  return (
    <section className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6 shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-teal-600">Primeros pasos</p>
          <h2 className="mt-1 text-lg font-black text-teal-950">Configura tu cuenta</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {data.completedSteps} de {data.totalSteps} pasos completados
          </p>
        </div>
        {nextStep && (
          <button
            onClick={() => navigateToModule(navigate, nextStep.module)}
            className="h-9 rounded-xl bg-teal-950 px-4 text-sm font-black text-white transition-colors hover:bg-teal-800"
          >
            {nextStep.title}
          </button>
        )}
      </div>

      {/* Barra de progreso */}
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-teal-100"
        role="progressbar"
        aria-valuenow={data.completionPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-teal-600 transition-all duration-500"
          style={{ width: `${data.completionPercentage}%` }}
        />
      </div>

      {/* Lista de pasos */}
      <ul className="mt-4 grid gap-2 sm:grid-cols-2" role="list">
        {data.steps.map((step) => (
          <li key={step.key} className="flex items-center gap-2.5 text-sm">
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-black ${
                step.isCompleted ? 'bg-teal-600 text-white' : 'border border-slate-300 text-transparent'
              }`}
              aria-hidden
            >
              ✓
            </span>
            <span className={step.isCompleted ? 'text-slate-400 line-through' : 'font-semibold text-slate-700'}>
              {step.title}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
