import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ToastContext } from './ToastContext'
import type { ToastType } from './ToastContext'

type Toast = { id: number; message: string; type: ToastType }

// Estilos según el tipo de aviso.
const STYLES: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-slate-200 bg-white text-slate-800',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  // Lista de avisos actualmente visibles.
  const [toasts, setToasts] = useState<Toast[]>([])
  // Un contador para darle un id único a cada aviso (useRef no provoca re-render).
  const idRef = useRef(0)

  // useCallback: mantenemos la MISMA función entre renders para que el contexto sea estable.
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = idRef.current++
    setToasts((current) => [...current, { id, message, type }])
    // Se auto-elimina a los 3.5s.
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* createPortal: dibuja los avisos en document.body, "por encima" de todo,
          sin que los corte un overflow:hidden o un z-index de algún contenedor. */}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${STYLES[toast.type]}`}
            >
              {toast.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}