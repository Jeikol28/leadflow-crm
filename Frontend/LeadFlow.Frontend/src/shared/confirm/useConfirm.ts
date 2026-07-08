import { useContext } from 'react'
import { ConfirmContext } from './ConfirmContext'

// Devuelve directamente la función confirm() lista para usar.
export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm debe usarse dentro de ConfirmProvider.')
  }
  return context.confirm
}
