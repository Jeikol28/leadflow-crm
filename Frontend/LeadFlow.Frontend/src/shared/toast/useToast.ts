import { useContext } from 'react'
import { ToastContext } from './ToastContext'

// Hook para usar los toasts desde cualquier componente.
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Si alguien lo usa fuera del Provider, fallamos con un mensaje claro.
    throw new Error('useToast debe usarse dentro de ToastProvider.')
  }
  return context
}