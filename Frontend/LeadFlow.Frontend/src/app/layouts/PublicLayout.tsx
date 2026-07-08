import { Outlet } from '@tanstack/react-router'

// Layout para pantallas publicas como landing, login y registro.
export function PublicLayout() {
  return (
    <main className="public-layout">
      <Outlet />
    </main>
  )
}
