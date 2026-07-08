import { createContext } from 'react'

// Tipos de aviso disponibles.
export type ToastType = 'success' | 'error' | 'info'

// Lo que el contexto expone a toda la app: una función para mostrar avisos.
export type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void
}

// El "canal" compartido. Empieza en null; el Provider lo llenará.
export const ToastContext = createContext<ToastContextValue | null>(null)