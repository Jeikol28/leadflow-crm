import { createContext } from 'react'

export type ConfirmOptions = {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

export type ConfirmContextValue = {
  // Devuelve una promesa: true si confirma, false si cancela.
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

export const ConfirmContext = createContext<ConfirmContextValue | null>(null)
