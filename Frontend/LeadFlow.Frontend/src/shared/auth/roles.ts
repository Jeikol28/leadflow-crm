// Roles definidos por el backend. Fuente única para evitar strings mágicos.
export const ROLES = {
  AdminEmpresa: 'AdminEmpresa',
  Gerente: 'Gerente',
  Vendedor: 'Vendedor',
  Soporte: 'Soporte',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// Indica si el rol del usuario está dentro de los permitidos.
export function hasAnyRole(userRole: string | undefined, allowed: readonly string[]) {
  if (!userRole) {
    return false
  }
  return allowed.includes(userRole)
}