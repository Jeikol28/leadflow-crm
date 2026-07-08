import { useState } from 'react'
import {
  BarChart3,
  Bell,
  Bot,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  FileCheck2,
  Package,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, Navigate, Outlet, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../providers/AuthProvider'
import { hasAnyRole, ROLES } from '../../shared/auth/roles'
import { useAlerts } from '../../features/dashboard/useAlerts'
import { useCompanySettings } from '../../features/settings/useCompanySettings'
import { Loader } from '../../shared/components/Loader'

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  exact: boolean
  roles?: readonly string[]
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard',   href: '/app',             icon: LayoutDashboard, exact: true  },
      { label: 'Clientes',    href: '/app/customers',   icon: Users,           exact: false },
      { label: 'Leads',       href: '/app/leads',       icon: TrendingUp,      exact: false },
      
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { label: 'Tareas',        href: '/app/tasks',        icon: ClipboardList, exact: false },
      { label: 'Interacciones', href: '/app/interactions', icon: MessageSquare, exact: false },
      { label: 'Servicios',     href: '/app/services',     icon: Package,       exact: false },
      { label: 'Cotizaciones',  href: '/app/quotes',       icon: FileText,      exact: false },
      { label: 'Reportes', href: '/app/reports', icon: BarChart3, exact: false, roles: [ROLES.AdminEmpresa, ROLES.Gerente] },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Asistente IA',  href: '/app/ai',       icon: Bot,         exact: false },
      { label: 'Usuarios',      href: '/app/users',    icon: ShieldCheck, exact: false, roles: [ROLES.AdminEmpresa, ROLES.Gerente] },
      { label: 'Configuración', href: '/app/settings', icon: Settings,    exact: false },
      { label: 'Auditoría',     href: '/app/audit',    icon: FileCheck2,  exact: false, roles: [ROLES.AdminEmpresa, ROLES.Gerente] },
    ],
  },
]

// Base classes sin colores — active/inactiveProps aportan los colores
const LINK_BASE =
  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-150'
const LINK_ACTIVE =
  'bg-white/12 text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)]'
const LINK_INACTIVE =
  'text-teal-100/65 hover:bg-white/10 hover:text-white'

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const { user, logout } = useAuth()
  const { data: company } = useCompanySettings()

  const initials = (user?.fullName ?? user?.email ?? 'LF')
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className="flex h-full flex-col bg-teal-950" aria-label="Navegación principal">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/8 px-5">
        <Link to="/" className="flex items-center gap-2.5" style={{ color: 'white' }}>
          {company?.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name ?? 'Logo de la empresa'}
              className="size-8 shrink-0 rounded-lg bg-white object-contain"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <span className="grid size-8 place-items-center rounded-lg bg-white text-[11px] font-black text-teal-950">
              LF
            </span>
          )}
          <span className="text-[15px] font-black tracking-[-0.025em]">{company?.name ?? 'LeadFlow'}</span>
        </Link>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Módulos">
        {NAV_GROUPS.map((group, gi) => {
          const visibleItems = group.items.filter(
            (item) => !item.roles || hasAnyRole(user?.role, item.roles),
          )

          if (visibleItems.length === 0) {
            return null
          }

          return (
            <div key={group.label} className={gi > 0 ? 'mt-6' : ''}>
              <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-teal-100/35">
                {group.label}
              </p>
              <ul className="space-y-0.5" role="list">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        className={LINK_BASE}
                        activeProps={{ className: LINK_ACTIVE }}
                        inactiveProps={{ className: LINK_INACTIVE }}
                        activeOptions={{ exact: item.exact }}
                        onClick={onLinkClick}
                      >
                        <Icon size={17} aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* User section */}
      <div className="shrink-0 border-t border-white/8 p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
          <Link
            to="/app/profile"
            onClick={onLinkClick}
            title="Mi perfil"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg transition-opacity hover:opacity-90"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/15 text-[11px] font-black text-white">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-black text-white">
                {user?.fullName ?? user?.email ?? 'Usuario'}
              </span>
              <span className="block truncate text-[11px] text-teal-100/50">{user?.role ?? 'Operador'}</span>
            </span>
          </Link>
          <button
            onClick={logout}
            className="grid size-7 shrink-0 place-items-center rounded-lg text-teal-100/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

const DISMISSED_ALERTS_KEY = 'leadflow_dismissed_alerts'
const READ_ALERTS_KEY = 'leadflow_read_alerts'

function loadDismissedAlerts(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_ALERTS_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

function loadReadAlerts(): string[] {
  try {
    return JSON.parse(localStorage.getItem(READ_ALERTS_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function AppLayout() {
  const { isAuthenticated, isLoadingSession } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [dismissed, setDismissed] = useState<string[]>(() => loadDismissedAlerts())
  const [read, setRead] = useState<string[]>(() => loadReadAlerts())
  const { data: alertsData } = useAlerts()

  // Las alertas son calculadas por el backend; "descartar" las oculta localmente.
  const visibleAlerts = (alertsData?.alerts ?? []).filter((alert) => !dismissed.includes(alert.alertId))
  const alertCount = visibleAlerts.length
  // Estilo tipo Facebook: solo cuentan las NO leídas para el globo de notificaciones.
  const unreadCount = visibleAlerts.filter((alert) => !read.includes(alert.alertId)).length

  function persistDismissed(next: string[]) {
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(next))
    setDismissed(next)
  }

  function dismissAlert(alertId: string) {
    persistDismissed(Array.from(new Set([...dismissed, alertId])))
  }

  function persistRead(next: string[]) {
    localStorage.setItem(READ_ALERTS_KEY, JSON.stringify(next))
    setRead(next)
  }

  // Marca una notificación como leída (sin quitarla de la lista).
  function markRead(alertId: string) {
    if (read.includes(alertId)) return
    persistRead(Array.from(new Set([...read, alertId])))
  }

  // Permite al usuario alternar entre leída y no leída.
  function toggleRead(alertId: string) {
    persistRead(read.includes(alertId) ? read.filter((id) => id !== alertId) : [...read, alertId])
  }

  function markAllRead() {
    persistRead(Array.from(new Set([...read, ...visibleAlerts.map((alert) => alert.alertId)])))
  }

  // Lleva al módulo relacionado con la alerta y cierra el panel.
  function goToAlert(entityType: string) {
    setNotifOpen(false)
    const type = entityType.toLowerCase()
    if (type.includes('task')) return navigate({ to: '/app/tasks' })
    if (type.includes('lead')) return navigate({ to: '/app/leads' })
    if (type.includes('quote')) return navigate({ to: '/app/quotes' })
    if (type.includes('customer')) return navigate({ to: '/app/customers' })
    return navigate({ to: '/app' })
  }

  if (isLoadingSession) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#f6fbf8]">
        <Loader label="Validando sesión..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-dvh bg-[#f6fbf8]">
      {/* Sidebar fijo — desktop */}
      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <SidebarContent />
      </div>

      {/* Sidebar móvil + overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-teal-950/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 shadow-2xl lg:hidden">
            <div className="absolute -right-9 top-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="grid size-8 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Cerrar menú"
              >
                <X size={16} />
              </button>
            </div>
            <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Área principal */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200/70 bg-white/95 px-5 backdrop-blur-sm lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-teal-900 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </button>

          {/* Logo móvil */}
          <Link to="/" className="flex items-center gap-2 lg:hidden" style={{ color: '#042f2e' }}>
            <span className="grid size-7 place-items-center rounded-lg bg-teal-950 text-[10px] font-black text-cyan-300">
              LF
            </span>
            <span className="text-sm font-black text-teal-950">LeadFlow</span>
          </Link>

          <div className="flex-1" />

          {/* Acciones topbar */}
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setNotifOpen((open) => !open)}
              className="relative grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-teal-900"
              aria-label="Notificaciones"
              aria-haspopup="true"
              aria-expanded={notifOpen}
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} aria-hidden />
                <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="flex items-center justify-between px-2 pb-2">
                    <p className="text-sm font-black text-teal-950">Notificaciones</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] font-black text-teal-700 transition-colors hover:text-teal-900"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  {alertCount === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-slate-500">Sin alertas pendientes.</p>
                  ) : (
                    <ul className="max-h-80 space-y-1 overflow-y-auto" role="list">
                      {visibleAlerts.slice(0, 8).map((alert) => {
                        const isRead = read.includes(alert.alertId)
                        return (
                          <li
                            key={alert.alertId}
                            className={`flex items-start gap-2 rounded-xl px-2 py-2 transition-colors ${
                              isRead ? 'hover:bg-slate-50' : 'bg-teal-50/70 hover:bg-teal-50'
                            }`}
                          >
                            {/* Punto de estado: clic para alternar leída / no leída */}
                            <button
                              onClick={() => toggleRead(alert.alertId)}
                              className="mt-1.5 shrink-0"
                              aria-label={isRead ? 'Marcar como no leída' : 'Marcar como leída'}
                              title={isRead ? 'Marcar como no leída' : 'Marcar como leída'}
                            >
                              <span
                                className={`block size-2 rounded-full ${isRead ? 'bg-slate-300' : 'bg-teal-600'}`}
                              />
                            </button>
                            <button
                              onClick={() => {
                                markRead(alert.alertId)
                                goToAlert(alert.relatedEntityType)
                              }}
                              className="min-w-0 flex-1 text-left"
                            >
                              <p
                                className={`text-[13px] ${
                                  isRead ? 'font-semibold text-slate-600' : 'font-black text-slate-800'
                                }`}
                              >
                                {alert.title}
                              </p>
                              <p className="mt-0.5 text-xs leading-5 text-slate-500">{alert.message}</p>
                            </button>
                            <button
                              onClick={() => dismissAlert(alert.alertId)}
                              className="mt-0.5 shrink-0 rounded-md p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600"
                              aria-label="Quitar notificación"
                            >
                              <X size={14} />
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Contenido de página */}
        <main className="px-5 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
          