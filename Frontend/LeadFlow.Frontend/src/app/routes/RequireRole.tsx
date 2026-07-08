import type { ReactNode } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { hasAnyRole } from '../../shared/auth/roles'

type RequireRoleProps = {
  allowedRoles: readonly string[]
  children: ReactNode
}

// Muestra el contenido solo si el rol del usuario está autorizado.
export function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { user } = useAuth()

  if (!hasAnyRole(user?.role, allowedRoles)) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-rose-600">
            Acceso restringido
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-teal-950">
            No tienes permiso
          </h1>
        </div>
        <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-20 text-center">
          <h2 className="text-lg font-black text-teal-950">Esta sección está reservada</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Tu rol actual no tiene acceso a esta área. Si crees que es un error, contacta al
            administrador de tu empresa.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}