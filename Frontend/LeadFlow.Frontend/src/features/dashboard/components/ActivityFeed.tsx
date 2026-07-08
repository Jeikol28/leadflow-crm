import { ClipboardList, FileText, Mail, Phone, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DashboardInteraction } from '../dashboard.types'

type ActivityConfig = { icon: LucideIcon; bg: string; color: string }

// Asigna icono y color según el tipo de interacción que envía el backend.
function activityStyle(type: string): ActivityConfig {
  const t = type.toLowerCase()
  if (t.includes('llamada') || t.includes('call')) return { icon: Phone, bg: 'bg-amber-100', color: 'text-amber-600' }
  if (t.includes('correo') || t.includes('email')) return { icon: Mail, bg: 'bg-slate-100', color: 'text-slate-500' }
  if (t.includes('whatsapp')) return { icon: Phone, bg: 'bg-emerald-100', color: 'text-emerald-600' }
  if (t.includes('reunion') || t.includes('reunión') || t.includes('meeting')) return { icon: Users, bg: 'bg-indigo-100', color: 'text-indigo-600' }
  if (t.includes('cotiz') || t.includes('quote')) return { icon: FileText, bg: 'bg-teal-100', color: 'text-teal-600' }
  return { icon: ClipboardList, bg: 'bg-sky-100', color: 'text-sky-600' }
}

function initials(name: string): string {
  const result = name
    .trim()
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return result || '—'
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })
}

function ActivityRow({ interaction }: { interaction: DashboardInteraction }) {
  const conf = activityStyle(interaction.type)
  const Icon = conf.icon
  const subtitle = interaction.customerName ?? interaction.leadTitle ?? interaction.type

  return (
    <li className="flex items-start gap-3 py-3">
      <span
        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${conf.bg} ${conf.color}`}
        aria-hidden
      >
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{interaction.description}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[11px] text-slate-400">{formatTime(interaction.interactionDate)}</span>
        <span className="grid size-5 place-items-center rounded-full bg-slate-100 text-[9px] font-black text-slate-500">
          {initials(interaction.userFullName)}
        </span>
      </div>
    </li>
  )
}

export function ActivityFeed({ interactions }: { interactions: DashboardInteraction[] }) {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_2px_16px_rgba(15,23,42,0.05)]">
      <h2 className="text-base font-black text-teal-950">Actividad reciente</h2>
      <p className="mt-0.5 text-sm text-slate-500">Últimos eventos del equipo</p>
      {interactions.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">
          Aún no hay interacciones registradas.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100" role="list">
          {interactions.map((interaction) => (
            <ActivityRow key={interaction.id} interaction={interaction} />
          ))}
        </ul>
      )}
    </section>
  )
}